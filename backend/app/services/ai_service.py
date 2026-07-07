import json
import logging
from app.config import settings

# Existing services for fallback
from app.services.priority_service import classify_email
from app.services.summary_service import generate_summary
from app.services.action_service import get_suggested_actions

logger = logging.getLogger(__name__)

# Cache structure: {message_id: {summary: [...], priority: "...", reason: "...", actions: [...]}}
_gemini_cache = {}


def get_email_ai_analysis(
    message_id: str,
    sender: str,
    subject: str,
    snippet: str,
    body: str,
    rules: list = None
) -> dict:
  """
  Analyzes an email using Google's Gemini API with caching.
  Falls back to rule-based services upon any error.
  """
  # 1. Check cache first
  if message_id in _gemini_cache:
    logger.info(f"Retrieved Gemini analysis for email {message_id} from cache")
    return _gemini_cache[message_id]

  # 2. Check if Gemini key is available
  api_key = settings.GEMINI_API_KEY
  if not api_key:
    logger.warning("GEMINI_API_KEY is not configured. Falling back to rule-based services.")
    return _get_fallback_analysis(sender, subject, snippet, rules)

  try:
    from google import genai
    from google.genai import types

    # Standard model is gemini-2.5-flash
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an intelligent email assistant. Analyze the following email:
    
    Sender: {sender}
    Subject: {subject}
    Snippet: {snippet}
    Body:
    {body}
    
    Provide your analysis as a valid JSON object matching this schema:
    {{
      "summary": ["bullet 1", "bullet 2", "bullet 3"],
      "priority": "Urgent" | "Important" | "Normal" | "Low Priority",
      "reason": "explanation of priority choice",
      "actions": ["suggested action 1", "suggested action 2"]
    }}
    
    Return ONLY valid JSON.
    """

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    # Parse and validate response
    if not response or not response.text:
      raise ValueError("Empty response received from Gemini API")

    result = json.loads(response.text.strip())
    
    if not isinstance(result, dict):
      raise ValueError("Response is not a JSON object")
      
    summary = result.get("summary")
    if not isinstance(summary, list):
      if isinstance(summary, str):
        summary = [summary]
      else:
        summary = []
        
    priority = result.get("priority")
    valid_priorities = ["Urgent", "Important", "Normal", "Low Priority"]
    if priority not in valid_priorities:
      priority = "Normal"
      
    actions = result.get("actions")
    if not isinstance(actions, list):
      if isinstance(actions, str):
        actions = [actions]
      else:
        actions = []

    validated_result = {
      "summary": summary,
      "priority": priority,
      "reason": result.get("reason", ""),
      "actions": actions
    }

    # Store in cache
    _gemini_cache[message_id] = validated_result
    logger.info(f"Successfully cached Gemini analysis for email {message_id}")
    return validated_result

  except Exception as exc:
    logger.error(f"Gemini API analysis failed: {exc}. Falling back to rule-based services.")
    return _get_fallback_analysis(sender, subject, snippet, rules)


def _get_fallback_analysis(sender: str, subject: str, snippet: str, rules: list = None) -> dict:
  """Generates fallback analysis using the existing rule-based services."""
  priority = classify_email(sender, subject, snippet, rules=rules)
  summary = generate_summary(sender, subject, snippet)
  actions = get_suggested_actions(sender, subject, snippet)
  
  return {
    "summary": summary,
    "priority": priority,
    "reason": "Fallback to rule-based priority classifier",
    "actions": actions
  }
