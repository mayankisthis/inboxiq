from fastapi import APIRouter, HTTPException, Request

from app.services.auth_service import get_user_credentials, get_session_user
from app.services.gmail_service import get_recent_emails
from app.services.priority_service import add_priority_to_emails
from app.services.rules_service import load_rules
from app.services.summary_service import generate_summary

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("/recent")
def recent_emails(request: Request):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  user = get_session_user(request)
  user_email = user.get("email") if user else ""
  rules = load_rules(user_email) if user_email else []

  try:
    raw_emails = get_recent_emails(credentials)
    emails = add_priority_to_emails(raw_emails, rules)
    for email in emails:
      email["aiSummary"] = generate_summary(
        email.get("sender", ""),
        email.get("subject", ""),
        email.get("snippet", ""),
      )
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to fetch emails: {exc}") from exc

  return {"emails": emails}
