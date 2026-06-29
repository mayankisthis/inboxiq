from pathlib import Path

from flask import Blueprint, send_from_directory

main_bp = Blueprint("main", __name__)

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent.parent / "frontend"


@main_bp.route("/")
def index():
  return send_from_directory(FRONTEND_DIR, "index.html")


@main_bp.route("/css/<path:filename>")
def css(filename):
  return send_from_directory(FRONTEND_DIR / "css", filename)
