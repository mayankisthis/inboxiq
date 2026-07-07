"""Rule-based Natural Language Search intent extractor for InboxIQ.

Extracts filter structures from query strings.
"""

import re

def parse_query(query: str) -> dict:
    """Parse search queries and extract query parameters."""
    if not query:
        return {
            "sender": None,
            "priority": None,
            "category": None,
            "keywords": [],
            "requires_action": False,
            "unread": False,
            "today": False
        }
        
    q = query.lower().strip()

    filters = {
        "sender": None,
        "priority": None,
        "category": None,
        "keywords": [],
        "requires_action": False,
        "unread": False,
        "today": False
    }

    # Extract sender: e.g. "from google" or "linkedin emails" or "emails from recruiter"
    from_match = re.search(r'from\s+([a-zA-Z0-9\-\.]+)', q)
    if from_match:
        filters["sender"] = from_match.group(1).strip()
    elif "linkedin" in q:
        filters["sender"] = "linkedin"
    elif "github" in q:
        filters["sender"] = "github"

    # Extract priority
    if "urgent" in q:
        filters["priority"] = "Urgent"
    elif "important" in q:
        filters["priority"] = "Important"
    elif "normal" in q:
        filters["priority"] = "Normal"
    elif "low priority" in q or "low" in q:
        filters["priority"] = "Low Priority"

    # Extract category
    if "promo" in q or "advertisement" in q or "deal" in q:
        filters["category"] = "Promotions"

    # Extract action required: e.g. "requiring action" or "action items"
    if "action" in q or "todo" in q or "need" in q or "oa" in q or "assessment" in q or "deadline" in q or "invoice" in q:
        filters["requires_action"] = True

    # Extract unread
    if "unread" in q or "new" in q:
        filters["unread"] = True

    # Extract today
    if "today" in q or "recent" in q or "latest" in q:
        filters["today"] = True

    # Extract keywords (e.g. internship)
    keywords_to_check = ["internship", "security", "newsletter", "invoice", "payment", "meeting", "alert", "recruiter", "hiring", "interview"]
    for kw in keywords_to_check:
        if kw in q:
            filters["keywords"].append(kw)

    return filters
