"""Gmail API integration for login verification and email operations."""

import base64
from datetime import datetime, timezone
from email.utils import parseaddr
import html
import re

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _build_gmail_service(credentials: Credentials):
  return build("gmail", "v1", credentials=credentials)


def _extract_header(headers: list[dict], name: str) -> str:
  for header in headers:
    if header.get("name", "").lower() == name.lower():
      return header.get("value", "")
  return ""


def _decode_base64url(data: str) -> str:
  """Decodes base64url data safely."""
  padding = len(data) % 4
  if padding:
    data += '=' * (4 - padding)
  decoded_bytes = base64.urlsafe_b64decode(data)
  return decoded_bytes.decode("utf-8", errors="replace")


def _strip_html_tags(html_content: str) -> str:
  """Strips HTML tags while preserving structure."""
  # Replace <br> and <br/> with newline
  text = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
  # Replace opening block-level tags like <p>, <div>, <li>, <tr>, <h1-6> with newline
  text = re.sub(r'<(p|div|li|tr|h[1-6])[^>]*>', '\n', text, flags=re.IGNORECASE)
  # Replace block-level tags like </p>, </div>, </li>, </tr> with newline
  text = re.sub(r'</(p|div|li|tr|h[1-6])>', '\n', text, flags=re.IGNORECASE)
  # Strip remaining tags
  text = re.sub(r'<[^>]+>', '', text)
  # Unescape HTML entities
  text = html.unescape(text)
  # Clean up extra spacing or leading/trailing empty lines
  lines = [line.strip() for line in text.split('\n')]
  # Merge consecutive empty lines
  result_lines = []
  for line in lines:
    if line:
      result_lines.append(line)
    elif result_lines and result_lines[-1] != "":
      result_lines.append("")
  return "\n".join(result_lines).strip()


def _parse_parts(parts: list) -> list[tuple[str, str]]:
  """Recursively extract parts and return a list of (mimeType, decoded_text) tuples."""
  extracted = []
  for part in parts:
    mime_type = part.get("mimeType", "")
    body = part.get("body", {})
    data = body.get("data")
    
    if data:
      try:
        decoded = _decode_base64url(data)
        extracted.append((mime_type, decoded))
      except Exception:
        pass
        
    # Recursively check sub-parts
    sub_parts = part.get("parts")
    if sub_parts:
      extracted.extend(_parse_parts(sub_parts))
      
  return extracted


def _extract_email_body(payload: dict, default_snippet: str = "") -> str:
  """Extracts the best text representation from the Gmail payload."""
  mime_type = payload.get("mimeType", "")
  body = payload.get("body", {})
  data = body.get("data")
  
  parts_extracted = []
  if data:
    try:
      decoded = _decode_base64url(data)
      parts_extracted.append((mime_type, decoded))
    except Exception:
      pass
      
  sub_parts = payload.get("parts")
  if sub_parts:
    parts_extracted.extend(_parse_parts(sub_parts))
    
  # Prefer text/plain
  plain_parts = [text for mime, text in parts_extracted if mime.lower() == "text/plain"]
  if plain_parts:
    return "\n".join(plain_parts)
    
  # Fallback to text/html
  html_parts = [text for mime, text in parts_extracted if mime.lower() == "text/html"]
  if html_parts:
    html_content = "\n".join(html_parts)
    cleaned = _strip_html_tags(html_content)
    if cleaned.strip():
      return cleaned
      
  return default_snippet


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


def get_recent_emails(credentials: Credentials, limit: int = 10, page_token: str = None) -> tuple[list[dict], str | None]:
  """Return the latest Gmail messages with sender, subject, snippet, and received date, and next page token."""
  service = _build_gmail_service(credentials)
  
  kwargs = {"userId": "me", "maxResults": limit}
  if page_token:
    kwargs["pageToken"] = page_token

  list_result = service.users().messages().list(**kwargs).execute()
  message_refs = list_result.get("messages", [])
  next_page_token = list_result.get("nextPageToken")
 
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
 
    label_ids = detail.get("labelIds", [])
    is_unread = "UNREAD" in label_ids
    is_starred = "STARRED" in label_ids

    emails.append(
      {
        "id": message_ref["id"],
        "sender": sender,
        "subject": subject,
        "snippet": snippet,
        "received_at": received_at,
        "is_unread": is_unread,
        "is_starred": is_starred,
        "labels": label_ids,
      }
    )
 
  return emails, next_page_token


def get_email_by_id(credentials: Credentials, message_id: str) -> dict:
  """Fetches a single Gmail message by ID and extracts its full headers and plain-text/cleaned-HTML body."""
  service = _build_gmail_service(credentials)
  detail = service.users().messages().get(userId="me", id=message_id, format="full").execute()

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

  # Extract the body recursively with safety fallback
  try:
    payload = detail.get("payload", {})
    body_text = _extract_email_body(payload, snippet)
  except Exception:
    body_text = snippet

  label_ids = detail.get("labelIds", [])
  is_unread = "UNREAD" in label_ids
  is_starred = "STARRED" in label_ids

  return {
    "id": message_id,
    "sender": sender,
    "subject": subject,
    "date": received_at,
    "snippet": snippet,
    "body": body_text,
    "is_unread": is_unread,
    "is_starred": is_starred,
    "labels": label_ids,
  }


def modify_email_labels(
    credentials: Credentials,
    message_id: str,
    add_labels: list[str] = None,
    remove_labels: list[str] = None
) -> dict:
  """Helper to modify labels on a Gmail message."""
  service = _build_gmail_service(credentials)
  body = {}
  if add_labels:
    body["addLabelIds"] = add_labels
  if remove_labels:
    body["removeLabelIds"] = remove_labels
    
  return service.users().messages().modify(
      userId="me",
      id=message_id,
      body=body
  ).execute()


def set_email_starred(credentials: Credentials, message_id: str, starred: bool) -> dict:
  if starred:
    return modify_email_labels(credentials, message_id, add_labels=["STARRED"])
  else:
    return modify_email_labels(credentials, message_id, remove_labels=["STARRED"])


def set_email_read(credentials: Credentials, message_id: str, read: bool) -> dict:
  if read:
    return modify_email_labels(credentials, message_id, remove_labels=["UNREAD"])
  else:
    return modify_email_labels(credentials, message_id, add_labels=["UNREAD"])


def set_email_archived(credentials: Credentials, message_id: str, archived: bool) -> dict:
  if archived:
    return modify_email_labels(credentials, message_id, remove_labels=["INBOX"])
  else:
    return modify_email_labels(credentials, message_id, add_labels=["INBOX"])
