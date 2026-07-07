from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.routes.auth import router as auth_router
from app.routes.emails import router as emails_router
from app.routes.health import router as health_router
from app.routes.rules import router as rules_router

app = FastAPI(title="InboxIQ", version="0.1.0")

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.CORS_ORIGINS,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.add_middleware(
  SessionMiddleware,
  secret_key=settings.SECRET_KEY,
  session_cookie="inboxiq_session",
  max_age=60 * 60 * 24 * 7,
  same_site="none" if settings.SESSION_SECURE else "lax",
  https_only=settings.SESSION_SECURE,
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(emails_router, prefix="/api")
app.include_router(rules_router, prefix="/api")
