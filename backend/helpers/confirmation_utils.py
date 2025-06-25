# confirmation_utils.py

def format_confirmation_prompt(template: str, data: dict) -> str:
    """
    Replace placeholders like {vendor}, {product} in a confirmation prompt template
    with actual values from the data dictionary.
    """
    try:
        return template.format(**data)
    except KeyError:
        return "❗Missing required info to generate confirmation prompt."


def has_all_required_fields(required_fields: list, user_data: dict) -> bool:
    """
    Check if all required fields are present in the user's input data.
    """
    return all(field in user_data and user_data[field] for field in required_fields)


def mock_confirm_action(task: str, data: dict, tasks_registry: dict):
    """
    Prepare a mocked confirmation response for a given task using its task definition.
    """
    task_def = tasks_registry.get(task)
    if not task_def:
        return {
            "reply": f"⚠️ Unrecognized task: {task}",
            "agent": None
        }

    missing_fields = [
        field for field in task_def.get("fields_required", [])
        if field not in data or not data[field]
    ]

    if missing_fields:
        return {
            "reply": f"⛔ Missing required info: {', '.join(missing_fields)}.",
            "agent": {
                "task": task,
                "fields_required": task_def.get("fields_required", []),
                "confirmation_prompt": task_def.get("confirmation_prompt")
            }
        }

    confirmation_text = format_confirmation_prompt(task_def["confirmation_prompt"], data)

    return {
        "reply": f"✅ {confirmation_text}\n\nWould you like me to proceed?",
        "agent": {
            "task": task,
            "status": "awaiting_confirmation",
            "fields_confirmed": data
        }
    }
