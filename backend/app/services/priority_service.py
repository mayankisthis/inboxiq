"""Rule-based email priority classification.

This module is the single backend entry point for priority labels.
Swap `classify_email` with an LLM-backed implementation later without
changing routes or the frontend contract.
"""

from typing import Literal

Priority = Literal["Urgent", "Important", "Normal", "Low Priority"]

URGENT_KEYWORDS = (
    "otp",
    "one-time password",
    "verification code",
    "verify your account",
    "password reset",
    "reset your password",
    "interview",
    "deadline",
    "assessment",
    "online test",
    "oa link",
    "coding round",
    "contest starts",
    "payment failed",
    "payment due",
    "invoice overdue",
    "security code",
    "two-factor",
    "2fa",
    "account recovery",
)

IMPORTANT_KEYWORDS = (
    "github",
    "security alert",
    "security notification",
    "unusual sign-in",
    "suspicious activity",
    "new login",
    "new sign in",
    "account alert",
    "recruiter",
    "recruitment",
    "hiring",
    "job opportunity",
    "application update",
    "internship",
    "college",
    "university",
    "campus",
    "placement",
    "hackathon",
    "unstop",
    "certificate",
    "event registration",
    "invitation",
)

LOW_PRIORITY_KEYWORDS = (
    "promotion",
    "promotional",
    "discount",
    "offer",
    "sale",
    "deal",
    "% off",
    "limited time",
    "shop now",
    "buy now",
    "cashback",
    "coupon",
    "voucher",
    "swiggy",
    "zomato",
    "instamart",
    "blinkit",
    "myntra",
    "amazon sale",
    "flipkart sale",
)

NORMAL_KEYWORDS = (
    "linkedin",
    "newsletter",
    "digest",
    "subscription",
    "recommendation",
    "people you may know",
    "profile viewed",
    "weekly update",
    "monthly update",
)


def _matches_any(text: str, keywords: tuple[str, ...]) -> bool:
  return any(keyword in text for keyword in keywords)



def classify_email(sender: str, subject: str, snippet: str, rules: list[dict] = None) -> Priority:
  """Classify an email using user-defined rules, then keyword rules."""
  if rules:
    for rule in rules:
      field = rule.get("field")
      contains = rule.get("contains", "").lower()
      priority = rule.get("priority")
      
      if not field or not contains or not priority:
        continue
      
      val = ""
      if field == "sender":
        val = sender.lower()
      elif field == "subject":
        val = subject.lower()
      elif field == "snippet":
        val = snippet.lower()
        
      if contains in val:
        return priority

  text = f"{sender} {subject} {snippet}".lower()

  if "github" in sender.lower() and (
    "security" in text or
    "application" in text or
    "access" in text
):
    return "Important"

  if _matches_any(text, URGENT_KEYWORDS):
    return "Urgent"

  if _matches_any(text, IMPORTANT_KEYWORDS):
    return "Important"

  if _matches_any(text, LOW_PRIORITY_KEYWORDS):
    return "Low Priority"

  if _matches_any(text, NORMAL_KEYWORDS):
    return "Normal"

  return "Normal"


def add_priority_to_emails(emails: list[dict], rules: list[dict] = None) -> list[dict]:
  """Attach a priority label to each email dict returned by the API."""
  for email in emails:
    email["priority"] = classify_email(
      email.get("sender", ""),
      email.get("subject", ""),
      email.get("snippet", ""),
      rules=rules
    )
  return emails
