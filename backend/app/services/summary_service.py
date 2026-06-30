"""AI Email Summary Generation Service.

Provides rule-based classification and summary generation for InboxIQ.
Designed as a modular layer to allow seamless replacement with LLMs (Gemini/OpenAI) later.
"""

from app.services.priority_service import LOW_PRIORITY_KEYWORDS, _matches_any

def generate_summary(sender: str, subject: str, snippet: str) -> list[str]:
    """Generate a short bullet-point summary of an email based on its attributes."""
    
    sender_lower = sender.lower()
    subject_lower = subject.lower()
    snippet_lower = snippet.lower()
    text = f"{sender_lower} {subject_lower} {snippet_lower}"

    # 1. GitHub security email
    if "github" in sender_lower and ("security" in text or "application" in text or "access" in text):
        return [
            "A third-party application gained access to your GitHub account.",
            "Review permissions if you do not recognize the application.",
            "Visit GitHub settings to revoke access if necessary."
        ]

    # 2. LinkedIn profile popularity
    if "linkedin" in sender_lower and ("profile" in text or "view" in text or "visibility" in text or "popular" in text):
        return [
            "Your LinkedIn profile received increased visibility.",
            "Recruiters or employers may be viewing your profile.",
            "Consider updating your profile and checking messages."
        ]

    # 3. Promotional email
    if _matches_any(text, LOW_PRIORITY_KEYWORDS) or "promo" in text:
        return [
            "Promotional content detected.",
            "No action required."
        ]

    # 4. Newsletter
    if any(kw in text for kw in ["newsletter", "digest", "weekly update", "monthly update"]):
        return [
            "Informational newsletter detected.",
            "Contains updates and curated content."
        ]

    # 5. Fallback rule-based summary
    bullets = []
    if subject:
        bullets.append(f"Discusses subject: {subject}")
    else:
        bullets.append("No subject line provided.")
        
    if snippet:
        clean_snippet = snippet.strip()
        if len(clean_snippet) > 85:
            clean_snippet = clean_snippet[:82] + "..."
        bullets.append(f"Content: {clean_snippet}")
    else:
        bullets.append("No snippet content available.")
        
    return bullets
