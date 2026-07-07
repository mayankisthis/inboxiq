"""Rule-based Natural Language Search intent extractor for InboxIQ.

Extracts filter structures from query strings and provides semantic filtering.
"""

from datetime import datetime, date, timezone, timedelta
import html
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


def match_email(email: dict, q: str) -> bool:
    """Returns True if the email matches the search query semantically."""
    if not q:
        return True
        
    q = q.lower().strip()
    
    # 1. First, check specific natural language intents
    # Check for "today"
    if "today" in q:
        received_at_str = email.get("received_at") or email.get("date")
        if received_at_str:
            try:
                dt = datetime.fromisoformat(received_at_str)
                # Check match against system UTC or local date
                if dt.date() == date.today() or dt.date() == (datetime.now(timezone.utc).date()):
                    return True
            except Exception:
                pass
                
    # Check for "yesterday"
    if "yesterday" in q:
        received_at_str = email.get("received_at") or email.get("date")
        if received_at_str:
            try:
                dt = datetime.fromisoformat(received_at_str)
                yesterday_utc = datetime.now(timezone.utc).date() - timedelta(days=1)
                yesterday_local = date.today() - timedelta(days=1)
                if dt.date() == yesterday_utc or dt.date() == yesterday_local:
                    return True
            except Exception:
                pass

    # Check for "security" / "security alerts"
    if "security" in q:
        security_patterns = ["security", "password reset", "verify", "verification", "login", "alert", "access", "revoke", "otp"]
        email_text = f"{email.get('sender', '')} {email.get('subject', '')} {email.get('snippet', '')}".lower()
        if any(pat in email_text for pat in security_patterns):
            return True

    # Check for "newsletter" / "newsletters"
    if "newsletter" in q or "newsletters" in q:
        newsletter_patterns = ["newsletter", "digest", "weekly update", "monthly update"]
        email_text = f"{email.get('sender', '')} {email.get('subject', '')} {email.get('snippet', '')}".lower()
        if any(pat in email_text for pat in newsletter_patterns):
            return True

    # Check for "interview"
    if "interview" in q:
        interview_patterns = ["interview", "assessment", "test", "coding round", "recruiter", "hiring"]
        email_text = f"{email.get('sender', '')} {email.get('subject', '')} {email.get('snippet', '')}".lower()
        if any(pat in email_text for pat in interview_patterns):
            return True

    # Check for sender-specific patterns like "from github" or "github mails"
    if "github" in q:
        if "github" in email.get("sender", "").lower():
            return True
    if "linkedin" in q:
        if "linkedin" in email.get("sender", "").lower():
            return True
            
    # Priority matches
    if "urgent" in q:
        if email.get("priority", "").lower() == "urgent":
            return True
    if "important" in q:
        if email.get("priority", "").lower() == "important":
            return True
    if "promotion" in q or "promotions" in q or "promo" in q:
        if email.get("priority", "").lower() == "low priority" or email.get("category", "").lower() == "promotions":
            return True

    # Check "from X"
    from_match = re.search(r'from\s+([a-zA-Z0-9\-\.]+)', q)
    if from_match:
        sender_name = from_match.group(1).lower()
        if sender_name in email.get("sender", "").lower():
            return True

    # 2. General text fallback search
    summary_text = ""
    summary = email.get("aiSummary") or email.get("summary")
    if summary:
        if isinstance(summary, list):
            summary_text = " ".join(summary)
        else:
            summary_text = str(summary)
            
    match_fields = [
        email.get("sender", ""),
        email.get("subject", ""),
        email.get("snippet", ""),
        email.get("priority", ""),
        summary_text
    ]
    
    match_text = " ".join(match_fields).lower()
    
    # Split query into words to match all keywords
    query_words = q.split()
    if not query_words:
        return False
        
    return all(word in match_text for word in query_words)


def filter_emails_semantically(emails: list[dict], query: str) -> list[dict]:
    """Filters a list of emails using semantic rules and text queries."""
    if not query:
        return emails
    return [email for email in emails if match_email(email, query)]
