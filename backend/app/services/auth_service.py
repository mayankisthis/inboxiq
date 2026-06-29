import json
import secrets

from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.config import settings

OAUTH_STATE_SESSION_KEY = "oauth_state"
USER_SESSION_KEY = "user"


def _validate_oauth_config() -> None:
  if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
    raise HTTPException(
      status_code=500,
      detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    )


def _create_oauth_flow() -> Flow:
  _validate_oauth_config()

  client_config = {
    "web": {
      "client_id": settings.GOOGLE_CLIENT_ID,
      "client_secret": settings.GOOGLE_CLIENT_SECRET,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
    }
  }

  return Flow.from_client_config(
    client_config,
    scopes=settings.GOOGLE_SCOPES,
    redirect_uri=settings.GOOGLE_REDIRECT_URI,
  )


def initiate_google_login(request: Request) -> RedirectResponse:
  flow = _create_oauth_flow()
  state = secrets.token_urlsafe(32)

  authorization_url, _ = flow.authorization_url(
    access_type="offline",
    prompt="consent",
    state=state,
  )

  request.session[OAUTH_STATE_SESSION_KEY] = state
  return RedirectResponse(authorization_url)


def handle_google_callback(
  request: Request,
  code: str | None = None,
  state: str | None = None,
  error: str | None = None,
) -> RedirectResponse:
  if error:
    return RedirectResponse(f"{settings.FRONTEND_URL}/?auth=error&message={error}")

  if not code or not state:
    return RedirectResponse(f"{settings.FRONTEND_URL}/?auth=error&message=missing_code")

  saved_state = request.session.pop(OAUTH_STATE_SESSION_KEY, None)
  if not saved_state or saved_state != state:
    return RedirectResponse(f"{settings.FRONTEND_URL}/?auth=error&message=invalid_state")

  flow = _create_oauth_flow()
  flow.fetch_token(code=code)
  credentials = flow.credentials

  gmail_service = build("gmail", "v1", credentials=credentials)
  profile = gmail_service.users().getProfile(userId="me").execute()
  email = profile.get("emailAddress")

  if not email:
    return RedirectResponse(f"{settings.FRONTEND_URL}/?auth=error&message=missing_email")

  request.session[USER_SESSION_KEY] = {
    "email": email,
    "credentials": json.loads(credentials.to_json()),
  }

  return RedirectResponse(f"{settings.FRONTEND_URL}/?auth=success")


def get_session_user(request: Request) -> dict:
  user = request.session.get(USER_SESSION_KEY)
  if not user:
    return {"authenticated": False}

  return {
    "authenticated": True,
    "email": user.get("email"),
  }


def logout(request: Request) -> dict:
  request.session.clear()
  return {"authenticated": False}


def get_user_credentials(request: Request) -> Credentials | None:
  user = request.session.get(USER_SESSION_KEY)
  if not user:
    return None

  return Credentials.from_authorized_user_info(user["credentials"])
