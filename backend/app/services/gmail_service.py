"""Gmail API integration for login verification and future email operations."""

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def verify_authenticated_user(credentials: Credentials) -> str:
  """
  Confirm Gmail access by reading the signed-in user's profile email.
  Does not fetch individual messages.
  """
  service = build("gmail", "v1", credentials=credentials)
  profile = service.users().getProfile(userId="me").execute()
  email = profile.get("emailAddress")

  if not email:
    raise ValueError("Gmail profile did not include an email address.")

  return email
