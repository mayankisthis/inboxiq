"""Rule-based Daily Digest processor.

Computes metrics (counts, promotions count, reading time) and extracts action items.
Designed as a modular service layer.
"""

import re
from datetime import datetime, timezone, timedelta

def clean_sender(sender: str) -> str:
    """Helper to clean email sender formatting, extracting the name portion."""
    if not sender:
        return "Unknown Sender"
    match = re.match(r'^([^<]+)', sender)
    if match:
        name = match.group(1).strip().strip('"').strip("'")
        if name:
            return name
    return sender

def get_digest(emails: list[dict], tz_offset_minutes: int = 0) -> dict:
    """Generate daily digest summary metrics and action items list from email records received today."""
    
    # Calculate target timezone
    # JavaScript getTimezoneOffset() returns minutes ahead/behind UTC.
    # E.g. JS returns -330 for UTC+5:30.
    # So we invert the sign to get UTC offset timedelta.
    tz = timezone(timedelta(minutes=-tz_offset_minutes))
    
    # Get current user local date
    user_now = datetime.now(tz)
    user_today = user_now.date()
    
    today_emails = []
    for email in emails:
        received_at_str = email.get("received_at")
        if not received_at_str:
            continue
        try:
            received_dt = datetime.fromisoformat(received_at_str)
            # Convert to user local timezone
            received_local_date = received_dt.astimezone(tz).date()
            if received_local_date == user_today:
                today_emails.append(email)
        except Exception:
            # Fallback if parsing fails
            continue
            
    total = len(today_emails)
    urgent = 0
    important = 0
    normal = 0
    low_priority = 0
    promotions_filtered = 0
    actions = []
    
    for email in today_emails:
        priority = email.get("priority", "Normal")
        if priority == "Urgent":
            urgent += 1
        elif priority == "Important":
            important += 1
        elif priority == "Normal":
            normal += 1
        elif priority == "Low Priority":
            low_priority += 1

        category = email.get("category", "")
        if category == "Promotions" or priority == "Low Priority" or "promo" in email.get("subject", "").lower():
            promotions_filtered += 1

        sender = email.get("sender", "")
        subject = email.get("subject", "")
        snippet = email.get("snippet", "")
        text = f"{sender} {subject} {snippet}".lower()
        clean_name = clean_sender(sender)

        # Keyword mapping
        if "interview" in text:
            actions.append(f"Prepare for interview from {clean_name}")
        elif "deadline" in text:
            actions.append(f"Address upcoming deadline: {subject}")
        elif "assessment" in text or "coding round" in text or "oa" in text:
            actions.append(f"Complete assessment / OA from {clean_name}")
        elif "payment due" in text or "invoice" in text:
            actions.append(f"Process payment due / invoice: {subject}")
        elif "security alert" in text:
            actions.append(f"Review {clean_name} security alert")

    # Estimated reading time: 15 seconds per email, minimum 1 min, rounded to nearest integer
    reading_time = "0 min"
    if total > 0:
        reading_minutes = max(1, round(total * 15 / 60))
        reading_time = f"{reading_minutes} min"

    # Remove duplicates preserving order
    actions = list(dict.fromkeys(actions))

    # Format user date for digest subtitle: "Summary for Jul 1, 2026"
    month_name = user_now.strftime("%b")
    day = str(user_now.day)
    year = str(user_now.year)
    subtitle = f"Summary for {month_name} {day}, {year}"

    return {
        "total": total,
        "urgent": urgent,
        "important": important,
        "normal": normal,
        "low_priority": low_priority,
        "promotions_filtered": promotions_filtered,
        "reading_time": reading_time,
        "actions": actions,
        "subtitle": subtitle
    }
