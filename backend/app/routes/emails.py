from fastapi import APIRouter, HTTPException, Request

from app.services.auth_service import get_user_credentials, get_session_user
from app.services.gmail_service import get_recent_emails, get_email_by_id
from app.services.priority_service import add_priority_to_emails
from app.services.rules_service import load_rules
from app.services.summary_service import generate_summary
from app.services.action_service import get_suggested_actions

router = APIRouter(prefix="/emails", tags=["emails"])

# Cache of fetched emails per user: {user_email: emails_list}
_user_emails_cache = {}


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
    if user_email:
      _user_emails_cache[user_email] = emails
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to fetch emails: {exc}") from exc

  return {"emails": emails, "nextPageToken": next_page_token}


@router.get("/search")
def search_emails(request: Request, q: str = ""):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  user = get_session_user(request)
  user_email = user.get("email") if user else ""
  rules = load_rules(user_email) if user_email else []

  try:
    emails = _user_emails_cache.get(user_email)
    if not emails:
      raw_emails, _ = get_recent_emails(credentials, limit=50)
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
      if user_email:
        _user_emails_cache[user_email] = emails

    from app.services.search_service import filter_emails_semantically
    filtered = filter_emails_semantically(emails, q)
    return {"emails": filtered}
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to search emails: {exc}") from exc


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
    
    from app.services.ai_service import get_email_ai_analysis
    ai_result = get_email_ai_analysis(
      message_id=message_id,
      sender=detail.get("sender", ""),
      subject=detail.get("subject", ""),
      snippet=detail.get("snippet", ""),
      body=detail.get("body", ""),
      rules=rules
    )
    
    return {
      "id": detail.get("id"),
      "sender": detail.get("sender"),
      "subject": detail.get("subject"),
      "date": detail.get("date"),
      "priority": ai_result.get("priority", "Normal"),
      "summary": ai_result.get("summary", []),
      "suggestedActions": ai_result.get("actions", []),
      "body": detail.get("body", "")
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


class ReplyRequest(BaseModel):
  emailId: str
  style: str


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


@router.post("/reply")
def reply_email(request: Request, body: ReplyRequest):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    detail = get_email_by_id(credentials, body.emailId)
    sender = detail.get("sender", "")
    subject = detail.get("subject", "")
    email_body = detail.get("body", "")
    
    from app.services.reply_service import generate_email_reply
    reply_text = generate_email_reply(
      sender=sender,
      subject=subject,
      body=email_body,
      style=body.style
    )
    
    return {"reply": reply_text}
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to generate reply: {exc}") from exc


class SendReplyRequest(BaseModel):
  emailId: str
  reply: str


@router.post("/send-reply")
def send_reply(request: Request, body: SendReplyRequest):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    from app.services.reply_send_service import send_email_reply
    send_email_reply(credentials, body.emailId, body.reply)
    return {"success": True}
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to send reply: {exc}") from exc


class StarRequest(BaseModel):
  starred: bool


class ReadRequest(BaseModel):
  read: bool


class ArchiveRequest(BaseModel):
  archived: bool


@router.post("/{message_id}/star")
def star_email(message_id: str, request: Request, body: StarRequest):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    from app.services.gmail_service import set_email_starred
    set_email_starred(credentials, message_id, body.starred)
    return {"success": True}
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to update star: {exc}") from exc


@router.post("/{message_id}/read")
def read_email(message_id: str, request: Request, body: ReadRequest):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    from app.services.gmail_service import set_email_read
    set_email_read(credentials, message_id, body.read)
    return {"success": True}
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to update read status: {exc}") from exc


@router.post("/{message_id}/archive")
def archive_email(message_id: str, request: Request, body: ArchiveRequest):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    from app.services.gmail_service import set_email_archived
    set_email_archived(credentials, message_id, body.archived)
    return {"success": True}
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to update archive status: {exc}") from exc
