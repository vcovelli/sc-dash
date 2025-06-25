# intent_utils.py

def is_off_topic(prompt: str) -> bool:
    lowered = prompt.lower()
    off_topic_keywords = [
        "weather", "sports", "game", "celebrity", "lottery", "who won", "crypto",
        "tiktok", "nba", "nfl", "mlb", "soccer", "football", "pop culture", "viral",
        "movie", "tv show", "music", "concert", "album", "artist", "band", "streaming",
        "episode", "actor", "actress", "viral video", "youtube", "instagram",
        "facebook", "twitter", "social media", "fashion", "style", "beauty",
        "makeup", "skincare", "lifestyle"
    ]
    return any(word in lowered for word in off_topic_keywords)


def detect_topic_and_intent(prompt: str):
    text = prompt.lower()

    topics = {
        "orders": ["order", "shipment", "delivery", "status"],
        "suppliers": ["supplier", "vendor", "manufacturer"],
        "products": ["product", "sku", "inventory", "category"],
        "customers": ["customer", "client", "buyer", "region"],
        "kpi": ["kpi", "metric", "revenue", "growth", "profit"],
        "analytics": ["chart", "trend", "graph", "insight"],
        "off-topic": ["nba", "nfl", "celebrity", "weather", "movie", "music"]
    }

    intents = {
        "ask_data": ["what", "show", "list", "how many", "which"],
        "get_insight": ["analyze", "insight", "explain", "trend", "why"],
        "request_action": ["send", "email", "order", "place", "cancel", "schedule"],
        "make_joke": ["joke", "funny", "laugh"],
        "greet": ["hello", "hi", "hey"],
        "confirm": ["yes", "sure", "okay", "do it"],
        "cancel": ["no", "stop", "cancel"]
    }

    topic = "general"
    intent = "unknown"

    for t, words in topics.items():
        if any(w in text for w in words):
            topic = t
            break

    for i, words in intents.items():
        if any(w in text for w in words):
            intent = i
            break

    return topic, intent


def parse_fields_from_prompt(prompt: str, required_fields: list) -> dict:
    # Naive mock extraction – improve later with NLP or LLM
    prompt = prompt.lower()
    parsed = {}

    for field in required_fields:
        if field in prompt:
            parsed[field] = f"<{field}> from input"  # Replace with real logic later

    return parsed