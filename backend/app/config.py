import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR.parent / ".env")


class Config:
  SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
  DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"
