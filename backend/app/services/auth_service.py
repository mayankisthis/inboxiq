import json
import secrets
from urllib.parse import quote

from fastapi import HTTPException, Request
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow

from app.config import settings
from app.services.gmail_service import verify_authenticated_user

OAUTH_STATE_SESSION_KEY = "oauth_state"
OAUTH_CODE_VERIFIER_SESSION_KEY = "oauth_code_verifier"
USER_SESSION_KEY = "user"


def _frontend_redirect(path: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}{path}"


def _redirect_with_error(message: str) -> RedirectResponse:
    return RedirectResponse(
        _frontend_redirect(f"/?auth=error&message={quote(message)}")
    )


def _validate_oauth_config() -> None:
    missing = [
        name
        for name, value in {
            "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
            "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
            "GOOGLE_REDIRECT_URI": settings.GOOGLE_REDIRECT_URI,
            "FRONTEND_URL": settings.FRONTEND_URL,
        }.items()
        if not value
    ]

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Google OAuth is not configured. Missing: {', '.join(missing)}",
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
    request.session[OAUTH_CODE_VERIFIER_SESSION_KEY] = flow.code_verifier

    return RedirectResponse(authorization_url)


def handle_google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    if error:
        return _redirect_with_error(error)

    if not code or not state:
        return _redirect_with_error("missing_code")

    saved_state = request.session.pop(OAUTH_STATE_SESSION_KEY, None)
    if not saved_state or saved_state != state:
        return _redirect_with_error("invalid_state")

    try:
        flow = _create_oauth_flow()

        code_verifier = request.session.pop(
            OAUTH_CODE_VERIFIER_SESSION_KEY,
            None,
        )

        if code_verifier:
            flow.code_verifier = code_verifier

        flow.fetch_token(code=code)

        credentials = flow.credentials
        email = verify_authenticated_user(credentials)

    except Exception as exc:
        return _redirect_with_error(str(exc))

    request.session[USER_SESSION_KEY] = {
        "email": email,
        "credentials": json.loads(credentials.to_json()),
    }

    return RedirectResponse(_frontend_redirect("/?auth=success"))


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

    return Credentials.from_authorized_user_info(
        user["credentials"]
    )