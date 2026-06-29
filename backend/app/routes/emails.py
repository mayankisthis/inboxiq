from fastapi import APIRouter, HTTPException, Request

from app.services.auth_service import get_user_credentials
from app.services.gmail_service import get_recent_emails

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("/recent")
def recent_emails(request: Request):
  credentials = get_user_credentials(request)
  if not credentials:
    raise HTTPException(status_code=401, detail="Not authenticated")

  try:
    emails = get_recent_emails(credentials)
  except Exception as exc:
    raise HTTPException(status_code=502, detail=f"Failed to fetch emails: {exc}") from exc

  return {"emails": emails}
