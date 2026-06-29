from fastapi import APIRouter, Request

from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google")
def google_login(request: Request):
  return auth_service.initiate_google_login(request)


@router.get("/google/callback")
def google_callback(
  request: Request,
  code: str | None = None,
  state: str | None = None,
  error: str | None = None,
):
  return auth_service.handle_google_callback(request, code, state, error)


@router.get("/me")
def get_current_user(request: Request):
  return auth_service.get_session_user(request)


@router.post("/logout")
def logout(request: Request):
  return auth_service.logout(request)
