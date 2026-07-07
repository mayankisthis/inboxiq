import logging
from app.config import settings

logger = logging.getLogger(__name__)

def generate_email_reply(
    sender: str,
    subject: str,
    body: str,
    style: str
) -> str:
  """
  Generates an email reply using Google's Gemini API with fallback to template-based responses.
  """
  api_key = settings.GEMINI_API_KEY
  if not api_key:
    logger.warning("GEMINI_API_KEY is not configured. Falling back to template reply.")
    return _generate_reply_fallback(sender, subject, style)

  try:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an intelligent email assistant. Draft a reply to the following email:
    
    Sender: {sender}
    Subject: {subject}
    Email Body:
    {body}
    
    Draft the reply in a "{style}" tone.
    - If "Professional": respectful, clear, business-appropriate.
    - If "Friendly": warm, casual, approachable, but polite.
    - If "Formal": highly polite, structured, professional vocabulary.
    - If "Short": concise, direct, under 2-3 sentences.
    
    Return ONLY the drafted email reply text. Do not add any extra markdown formatting (like backticks or intro phrases) other than the email text itself.
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )

    if not response or not response.text:
      raise ValueError("Empty response received from Gemini API")

    return response.text.strip()

  except Exception as exc:
    logger.error(f"Gemini reply generation failed: {exc}. Falling back to template reply.")
    return _generate_reply_fallback(sender, subject, style)


def _generate_reply_fallback(sender: str, subject: str, style: str) -> str:
  """Generates a rule-based fallback reply matching the chosen tone style."""
  if style == "Friendly":
    return f"Hi {sender},\n\nThanks for reaching out! I've received your email regarding '{subject}' and will get back to you shortly.\n\nBest,\n[Your Name]"
  elif style == "Formal":
    return f"Dear {sender},\n\nThank you for your correspondence regarding '{subject}'. I acknowledge receipt of your message and shall provide a detailed response in due course.\n\nSincerely,\n[Your Name]"
  elif style == "Short":
    return f"Thanks! Received your email. Will follow up soon."
  else:  # Professional
    return f"Hello {sender},\n\nThank you for contacting me. Regarding '{subject}', I have received your message and will review it shortly. Please let me know if there's anything urgent.\n\nBest regards,\n[Your Name]"
