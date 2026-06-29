"""Gmail API integration for login verification and email operations."""

from datetime import datetime, timezone
from email.utils import parseaddr

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _build_gmail_service(credentials: Credentials):
  return build("gmail", "v1", credentials=credentials)


def _extract_header(headers: list[dict], name: str) -> str:
  for header in headers:
    if header.get("name", "").lower() == name.lower():
      return header.get("value", "")
  return ""


def verify_authenticated_user(credentials: Credentials) -> str:
  """
  Confirm Gmail access by reading the signed-in user's profile email.
  Does not fetch individual messages.
  """
  service = _build_gmail_service(credentials)
  profile = service.users().getProfile(userId="me").execute()
  email = profile.get("emailAddress")

  if not email:
    raise ValueError("Gmail profile did not include an email address.")

  return email


def get_recent_emails(credentials: Credentials, limit: int = 10) -> list[dict]:
  """Return the latest Gmail messages with sender, subject, snippet, and received date."""
  service = _build_gmail_service(credentials)
  list_result = service.users().messages().list(userId="me", maxResults=limit).execute()
  message_refs = list_result.get("messages", [])

  emails = []
  for message_ref in message_refs:
    detail = (
      service.users()
      .messages()
      .get(
        userId="me",
        id=message_ref["id"],
        format="metadata",
        metadataHeaders=["From", "Subject"],
      )
      .execute()
    )

    headers = detail.get("payload", {}).get("headers", [])
    from_header = _extract_header(headers, "From")
    sender_name, sender_email = parseaddr(from_header)
    sender = sender_name or sender_email or from_header or "Unknown sender"

    subject = _extract_header(headers, "Subject") or "(No subject)"
    snippet = detail.get("snippet", "")

    internal_date_ms = int(detail.get("internalDate", 0))
    received_at = datetime.fromtimestamp(
      internal_date_ms / 1000,
      tz=timezone.utc,
    ).isoformat()

    emails.append(
      {
        "sender": sender,
        "subject": subject,
        "snippet": snippet,
        "received_at": received_at,
      }
    )

  return emails
