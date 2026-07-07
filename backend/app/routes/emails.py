from fastapi import APIRouter, HTTPException, Request

from app.services.auth_service import get_user_credentials, get_session_user
from app.services.gmail_service import get_recent_emails, get_email_by_id
from app.services.priority_service import add_priority_to_emails
from app.services.rules_service import load_rules
from app.services.summary_service import generate_summary
from app.services.action_service import get_suggested_actions

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("/recent")
def recent_emails(request: Request, pageToken: str = None):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  user = get_session_user(request)
  user_email = user.get("email") if user else ""
  rules = load_rules(user_email) if user_email else []

  try:
    raw_emails, next_page_token = get_recent_emails(credentials, limit=50, page_token=pageToken)
    emails = add_priority_to_emails(raw_emails, rules)
    for email in emails:
      email["aiSummary"] = generate_summary(
        email.get("sender", ""),
        email.get("subject", ""),
        email.get("snippet", ""),
      )
      email["suggestedActions"] = get_suggested_actions(
        email.get("sender", ""),
        email.get("subject", ""),
        email.get("snippet", ""),
      )
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to fetch emails: {exc}") from exc

  return {"emails": emails, "nextPageToken": next_page_token}


@router.get("/message/{message_id}")
def email_detail(request: Request, message_id: str):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  user = get_session_user(request)
  user_email = user.get("email") if user else ""
  rules = load_rules(user_email) if user_email else []

  try:
    detail = get_email_by_id(credentials, message_id)
    classified_emails = add_priority_to_emails([detail], rules)
    classified = classified_emails[0]
    
    summary = generate_summary(
      classified.get("sender", ""),
      classified.get("subject", ""),
      classified.get("snippet", ""),
    )
    suggested_actions = get_suggested_actions(
      classified.get("sender", ""),
      classified.get("subject", ""),
      classified.get("snippet", ""),
    )
    
    return {
      "id": classified.get("id"),
      "sender": classified.get("sender"),
      "subject": classified.get("subject"),
      "date": classified.get("date"),
      "priority": classified.get("priority", "Normal"),
      "summary": summary,
      "suggestedActions": suggested_actions,
      "body": classified.get("body", "")
    }
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to fetch email detail: {exc}") from exc


@router.get("/digest")
def email_digest(request: Request, tz_offset: int = 0):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  user = get_session_user(request)
  user_email = user.get("email") if user else ""
  rules = load_rules(user_email) if user_email else []

  try:
    raw_emails, _ = get_recent_emails(credentials, limit=50)
    emails = add_priority_to_emails(raw_emails, rules)
    from app.services.digest_service import get_digest
    digest = get_digest(emails, tz_offset)
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to generate digest: {exc}") from exc

  return digest


from pydantic import BaseModel

class SearchRequest(BaseModel):
  query: str


@router.post("/search")
def search_query(request: Request, body: SearchRequest):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    from app.services.search_service import parse_query
    filters = parse_query(body.query)
  except Exception as exc:
    raise HTTPException(status_code=500, detail=f"Failed to parse search query: {exc}") from exc

  return filters
