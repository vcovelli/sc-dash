import re

def extract_fields_from_prompt(prompt: str, required_fields: list) -> dict:
    """
    Very basic mock NLP field extraction (regex-based or keyword match).
    Can be replaced with LLM-based parser later.
    """
    prompt = prompt.lower()
    extracted = {}

    for field in required_fields:
        # Naive pattern matching for demo
        if field == "vendor" or field == "supplier":
            match = re.search(r"(?:to|from)\s+([\w\s&]+)", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "product":
            match = re.search(r"order\s+([\w\s]+)", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "quantity":
            match = re.search(r"(\d+)\s+(?:units|pieces|x)", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "date":
            match = re.search(r"\b(?:on\s+)?(\d{4}-\d{2}-\d{2})\b", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "time":
            match = re.search(r"\b(?:at\s+)?(\d{1,2}:\d{2})\b", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "location":
            match = re.search(r"to\s+([\w\s]+)$", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "subject":
            match = re.search(r"subject[:\-]\s*(.*)", prompt)
            if match:
                extracted[field] = match.group(1).strip()

        elif field == "message":
            match = re.search(r"message[:\-]\s*(.*)", prompt)
            if match:
                extracted[field] = match.group(1).strip()

    return extracted