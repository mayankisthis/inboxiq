import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")

GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly"


class Settings:
  SECRET_KEY: str = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
  DEBUG: bool = os.environ.get("DEBUG", "0") == "1"
  CORS_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
  ]

  GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
  GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")
  GOOGLE_REDIRECT_URI: str = os.environ.get(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/api/auth/google/callback",
  )
  FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5173")
  GOOGLE_SCOPES: list[str] = [GMAIL_READONLY_SCOPE]


settings = Settings()
