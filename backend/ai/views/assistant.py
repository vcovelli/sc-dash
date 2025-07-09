import json
import random
import requests
from django.db import connection
from rest_framework.views import APIView
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import StreamingHttpResponse

from api.agents.agent_tasks import detect_agent_task, AGENTING_TASKS, get_agenting_response, is_agenting_trigger
from helpers.intent_utils import detect_topic_and_intent, is_off_topic, parse_fields_from_prompt
from helpers.confirmation_utils import mock_confirm_action, has_all_required_fields
from helpers.field_extraction import extract_fields_from_prompt
from accounts.permissions import IsReadOnlyOrAbove
from accounts.mixins import CombinedOrgMixin

OLLAMA_URL = "http://ai:11434/api/chat"

# ==================== CORE AI ====================

def get_ollama_reply(messages, model="llama3"):
    try:
        r = requests.post(
            OLLAMA_URL,
            json={"model": model, "messages": messages},
            stream=True,
            timeout=60
        )
        r.raise_for_status()
    except requests.RequestException as e:
        return f"[Error contacting Ollama: {str(e)}]"

    reply = ""
    for line in r.iter_lines():
        if line:
            try:
                obj = json.loads(line.decode("utf-8"))
                if "message" in obj and "content" in obj["message"]:
                    reply += obj["message"]["content"]
            except Exception:
                continue
    return reply.strip()

# ==================== CONTEXT & SCHEMA ====================

def get_schema_context():
    return """
- suppliers(id, name)
- orders(id, supplier_id, shipment_date, delivery_date, status, revenue)
- products(id, name, category, price)
- customers(id, name, region, signup_date, lifetime_value)

Relationships:
- orders.supplier_id → suppliers.id
- orders.product_id → products.id
- orders.customer_id → customers.id
"""

# ==================== VIEWS ====================

class AssistantView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def post(self, request):
        prompt = request.data.get("message", "").strip()
        if not prompt:
            return Response({"error": "Missing 'message'"}, status=400)

        session_agent_state = request.session.get("agent_state", {})

        # ✅ Handle active agent task in progress
        if session_agent_state and session_agent_state.get("status") != "confirmed":
            task_key = session_agent_state.get("task")
            fields_required = session_agent_state.get("fields_required", [])
            collected_fields = session_agent_state.get("fields_collected", {})

            extracted_fields = extract_fields_from_prompt(prompt, fields_required)
            collected_fields.update(extracted_fields)

            if has_all_required_fields(fields_required, collected_fields):
                response = mock_confirm_action(task_key, collected_fields, AGENTING_TASKS)
                session_agent_state.update({
                    "fields_collected": collected_fields,
                    "status": "awaiting_confirmation"
                })
                request.session["agent_state"] = session_agent_state
                return Response(response)

            missing = [f for f in fields_required if f not in collected_fields or not collected_fields[f]]
            request.session["agent_state"] = {
                "task": task_key,
                "fields_required": fields_required,
                "fields_collected": collected_fields,
                "status": "collecting"
            }
            return Response({
                "reply": f"❓ I still need the following: {', '.join(missing)}"
            })

        # ✅ Handle user confirmation
        if session_agent_state.get("status") == "awaiting_confirmation":
            topic, intent = detect_topic_and_intent(prompt)
            if intent == "confirm":
                del request.session["agent_state"]
                return Response({"reply": f"✅ Task '{session_agent_state['task']}' confirmed and processed!"})
            elif intent == "cancel":
                del request.session["agent_state"]
                return Response({"reply": "❌ Okay, I've cancelled that task."})

        # ✅ Detect new agenting task
        if is_agenting_trigger(prompt):
            response = get_agenting_response(prompt)
            if "agent" in response:
                request.session["agent_state"] = {
                    "task": response["agent"]["task"],
                    "fields_required": response["agent"]["fields_required"],
                    "fields_collected": {},
                    "status": "collecting"
                }
            return Response(response)

        # ✅ Off-topic filtering (after agenting logic)
        if is_off_topic(prompt):
            return Response({
                "reply": random.choice(AGENTING_TASKS["__off_topic"]["responses"])
            })

        # ✅ Default LLM fallback
        session_messages = request.session.get("chat_history", [])
        if not isinstance(session_messages, list):
            session_messages = []

        session_messages.append({"role": "user", "content": prompt})
        if len(session_messages) > 12:
            session_messages = session_messages[-12:]

        schema = get_schema_context()
        system_msg = {
            "role": "system",
            "content": f"""
    You are SupplyWise AI — a sharp, business-savvy assistant with personality.
    You're connected to a live relational database. Here's the schema:

    {schema}

    Guidelines:
    - Use previous context where relevant.
    - Avoid repeating unless user asks for a summary.
    - Gracefully recover if a previous topic is unclear.
    """
        }

        full_messages = [system_msg] + session_messages

        try:
            reply = get_ollama_reply(full_messages)
            session_messages.append({"role": "assistant", "content": reply})
            request.session["chat_history"] = session_messages
            return Response({"reply": reply})
        except Exception as e:
            return Response({
                "reply": f"⚠️ Something went wrong while processing your request. Please try again.\n\nError: {str(e)}"
            }, status=500)
        
@method_decorator(csrf_exempt, name="dispatch")
class AssistantStreamView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def post(self, request):
        try:
            body = json.loads(request.body)
            prompt = body.get("message", "").strip()
        except:
            return Response({"error": "Invalid JSON"}, status=400)

        if not prompt:
            return Response({"error": "Missing 'message'"}, status=400)

        # ✅ Off-topic check BEFORE hitting Ollama
        if is_off_topic(prompt):
            fallback = random.choice(AGENTING_TASKS["__off_topic"]["responses"])
            def fallback_stream():
                yield fallback
            return StreamingHttpResponse(fallback_stream(), content_type="text/plain")

        # ✅ Normal LLM stream
        messages = [{"role": "user", "content": prompt}]
        system_msg = {
            "role": "system",
            "content": "You are SupplyWise AI. Be helpful, insightful, and quick."
        }
        full_messages = [system_msg] + messages

        def stream():
            try:
                with requests.post(
                    OLLAMA_URL,
                    json={"model": "llama3", "messages": full_messages},
                    stream=True,
                    timeout=60
                ) as r:
                    r.raise_for_status()
                    for line in r.iter_lines():
                        if line:
                            try:
                                obj = json.loads(line.decode("utf-8"))
                                content = obj.get("message", {}).get("content")
                                if content:
                                    yield content
                            except:
                                continue
            except Exception as e:
                yield f"\n[Stream error: {str(e)}]"

        return StreamingHttpResponse(stream(), content_type="text/plain")


class InsightView(CombinedOrgMixin, APIView):
    permission_classes = [IsReadOnlyOrAbove]

    def post(self, request):
        chart_data = request.data.get("chartData")
        chart_config = request.data.get("chartConfig")

        if not isinstance(chart_data, list) or not isinstance(chart_config, dict):
            return Response({"error": "Missing or invalid chartData or chartConfig"}, status=400)

        if not chart_data:
            return Response({"insight": "No data to analyze. Upload some records or generate a report first."})

        messages = [
            {
                "role": "system",
                "content": """
You're a business intelligence AI.
Interpret chart data in clear, business-focused language.
- Avoid repeating chart labels.
- Highlight patterns, anomalies, or risks.
- Suggest business actions if possible.
- Insight must fit within 1-2 smart sentences.
"""
            },
            {
                "role": "user",
                "content": f"""
Chart configuration:
{json.dumps(chart_config, indent=2)}

Sample data (first 5 rows):
{json.dumps(chart_data[:5], indent=2)}
"""
            }
        ]

        insight = get_ollama_reply(messages)
        return Response({"insight": insight})
