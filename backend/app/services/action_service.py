"""Rule-based Action Suggestions service for InboxIQ.

Provides a modular layer to return actionable next steps for a given email.
"""

from app.services.priority_service import LOW_PRIORITY_KEYWORDS, _matches_any

def get_suggested_actions(sender: str, subject: str, snippet: str) -> list[str]:
    """Generate a list of suggested actions for the email based on patterns."""
    
    sender_lower = sender.lower()
    subject_lower = subject.lower()
    snippet_lower = snippet.lower()
    text = f"{sender_lower} {subject_lower} {snippet_lower}"

    # 1. GitHub security email
    if "github" in sender_lower and ("security" in text or "application" in text or "access" in text):
        return [
            "Review GitHub permissions",
            "Revoke application access",
            "Open security settings"
        ]

    # 2. Internship or OA email
    if any(kw in text for kw in ["internship", "assessment", "oa", "coding round", "deadline", "test", "contest"]):
        return [
            "Complete assessment",
            "Add deadline to calendar",
            "Mark as urgent"
        ]

    # 3. Recruiter email
    if any(kw in text for kw in ["recruiter", "hiring", "job opportunity", "interview", "hr", "apply"]):
        return [
            "Reply to recruiter",
            "Save for follow-up",
            "Update profile"
        ]

    # 4. Promotional email
    if _matches_any(text, LOW_PRIORITY_KEYWORDS) or "promo" in text:
        return [
            "Ignore",
            "Archive",
            "Unsubscribe"
        ]

    # 5. Default actions
    return [
        "Read message",
        "Archive email",
        "Mark as read"
    ]
