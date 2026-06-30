"""User-defined priority rules storage helper.

Manages rules config mapping by user email in `user_rules.json`.
"""

import json
from pathlib import Path

RULES_FILE = Path("user_rules.json")

def load_rules(user_email: str) -> list[dict]:
    """Load the custom priority rules configuration for the user."""
    if not RULES_FILE.exists():
        return []
    try:
        with open(RULES_FILE, "r") as f:
            data = json.load(f)
            return data.get(user_email, [])
    except Exception:
        return []

def save_rules(user_email: str, rules: list[dict]) -> None:
    """Save the custom priority rules configuration for the user."""
    data = {}
    if RULES_FILE.exists():
        try:
            with open(RULES_FILE, "r") as f:
                data = json.load(f)
        except Exception:
            pass
    data[user_email] = rules
    with open(RULES_FILE, "w") as f:
        json.dump(data, f, indent=2)
