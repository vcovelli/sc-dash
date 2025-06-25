import json
from pathlib import Path

SCHEMA_DIR = Path("/user_schemas")

def load_schema(user_id: str):
    path = SCHEMA_DIR / f"{user_id}.json"
    if path.exists():
        with open(path, "r") as f:
            return json.load(f)
    else:
        raise FileNotFoundError(f"Schema for user {user_id} not found.")
