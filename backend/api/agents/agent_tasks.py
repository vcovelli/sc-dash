# agent_tasks.py

AGENTING_TASKS = {
    "email vendor": {
        "key": "email_vendor",
        "trigger_phrases": ["email vendor", "send email to vendor", "contact supplier"],
        "reply": "📨 Sure, I can draft that for you.\n\nWho should I email and what’s the message?",
        "fields_required": ["vendor", "subject", "message"],
        "confirmation_prompt": "Send email to {vendor} with subject '{subject}'?"
    },
    "place order": {
        "key": "place_order",
        "trigger_phrases": ["place order", "submit order", "create purchase"],
        "reply": "🛒 Got it. What would you like to order, and from which supplier?",
        "fields_required": ["product", "quantity", "supplier"],
        "confirmation_prompt": "Confirm placing order for {quantity} x {product} with {supplier}?"
    },
    "schedule delivery": {
        "key": "schedule_delivery",
        "trigger_phrases": ["schedule delivery", "book shipment", "arrange delivery"],
        "reply": "📦 When and where should I schedule this delivery?",
        "fields_required": ["date", "time", "location"],
        "confirmation_prompt": "Schedule delivery on {date} at {time} to {location}?"
    },
    "__off_topic": {
        "responses": [
            "I'm focused on supply chain intelligence — if you're looking for revenue trends, I'm your assistant!",
            "That's a bit outside my wheelhouse — but if you've got data, I've got answers.",
            "Sorry, I'm allergic to off-topic questions. But I thrive on inventory insights, demand forecasts, and more!",
            "Ask me about customers, products, or orders — I'm all ears (well, all virtual ears).",
            "Out-of-scope alert 🚨 — redirecting you back to the land of business intelligence. What would you like to explore?",
            "Let's stay laser-focused on supply chain strategy — that's where I shine.",
            "Lock in."
        ]
    }
}


def detect_agent_task(prompt: str):
    lowered = prompt.lower()
    for task_name, task in AGENTING_TASKS.items():
        if task_name == "__off_topic":
            continue
        if any(trigger in lowered for trigger in task["trigger_phrases"]):
            return task
    return None


def is_agenting_trigger(prompt: str) -> bool:
    return detect_agent_task(prompt) is not None


def get_agenting_response(prompt: str) -> dict:
    task = detect_agent_task(prompt)
    if not task:
        return {}

    return {
        "reply": task["reply"],
        "agent": {
            "task": task["key"],
            "fields_required": task["fields_required"],
            "confirmation_prompt": task["confirmation_prompt"]
        }
    }
