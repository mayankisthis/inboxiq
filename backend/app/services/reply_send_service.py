import base64
import logging
from email.mime.text import MIMEText
from email.utils import parseaddr
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

def _extract_header(headers: list[dict], name: str) -> str:
  for header in headers:
    if header.get("name", "").lower() == name.lower():
      return header.get("value", "")
  return ""

def send_email_reply(
    credentials: Credentials,
    original_message_id: str,
    reply_text: str
) -> dict:
  """
  Constructs and sends a threaded reply to an existing email thread via Gmail.
  """
  try:
    service = build("gmail", "v1", credentials=credentials)
    
    # 1. Fetch original email metadata to maintain thread context
    msg = service.users().messages().get(
        userId="me",
        id=original_message_id,
        format="full"
    ).execute()
    
    thread_id = msg.get("threadId")
    headers = msg.get("payload", {}).get("headers", [])
    
    # 2. Extract key threading headers
    orig_msg_id = _extract_header(headers, "Message-ID")
    orig_subject = _extract_header(headers, "Subject") or "(No subject)"
    orig_from = _extract_header(headers, "From")
    orig_to = _extract_header(headers, "To")
    orig_cc = _extract_header(headers, "Cc")
    orig_references = _extract_header(headers, "References")
    orig_reply_to = _extract_header(headers, "Reply-To")

    # 3. Determine recipient (To) address
    user_profile = service.users().getProfile(userId="me").execute()
    user_email = user_profile.get("emailAddress", "").lower()
    
    _, from_email = parseaddr(orig_from)
    
    if from_email.lower() == user_email:
      to_address = orig_to
    else:
      to_address = orig_reply_to if orig_reply_to else orig_from

    # 4. Formulate subject line
    subject = orig_subject
    if not subject.lower().startswith("re:"):
      subject = f"Re: {subject}"

    # 5. Build RFC2822 MIME message
    mime_msg = MIMEText(reply_text)
    mime_msg["To"] = to_address
    if orig_cc:
      mime_msg["Cc"] = orig_cc
    mime_msg["Subject"] = subject
    
    if orig_msg_id:
      mime_msg["In-Reply-To"] = orig_msg_id
      mime_msg["References"] = f"{orig_references} {orig_msg_id}".strip() if orig_references else orig_msg_id

    # 6. Encode and send
    raw_message = base64.urlsafe_b64encode(mime_msg.as_bytes()).decode("utf-8")
    
    send_payload = {
        "raw": raw_message,
        "threadId": thread_id
    }
    
    sent_detail = service.users().messages().send(
        userId="me",
        body=send_payload
    ).execute()
    
    logger.info(f"Successfully sent reply to message {original_message_id} in thread {thread_id}")
    return sent_detail

  except Exception as exc:
    logger.error(f"Failed to send Gmail reply: {exc}")
    raise exc
