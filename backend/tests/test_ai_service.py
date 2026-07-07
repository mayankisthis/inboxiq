import sys
import os

# Adjust path to import from backend app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.services.ai_service import (
    get_email_ai_analysis,
    _gemini_cache,
)

def test_fallback_when_no_api_key():
    # Force settings key to be empty
    original_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    
    try:
        # Evaluate analysis
        res = get_email_ai_analysis(
            message_id="mock_id_fallback",
            sender="GitHub <noreply@github.com>",
            subject="Security alert",
            snippet="A dependency vulnerability alert",
            body="This is full body for github alert."
        )
        
        # Verify fallback fields match rule-based outcomes
        assert res["priority"] == "Important"  # github security alert rule
        assert isinstance(res["summary"], list)
        assert len(res["summary"]) > 0
        assert "vulnerability" in res["summary"][0].lower() or "github" in res["summary"][0].lower() or "discusses" in res["summary"][0].lower()
        print("PASSED test_fallback_when_no_api_key")
    finally:
        settings.GEMINI_API_KEY = original_key


def test_ai_analysis_caching():
    # Cache result manually
    mock_id = "mock_id_cache_test"
    mock_data = {
        "summary": ["Bullet 1", "Bullet 2"],
        "priority": "Urgent",
        "reason": "Test reason",
        "actions": ["Action 1"]
    }
    
    _gemini_cache[mock_id] = mock_data
    
    # This should return instantly from cache without calling settings or client APIs
    res = get_email_ai_analysis(
        message_id=mock_id,
        sender="Any",
        subject="Any",
        snippet="Any",
        body="Any"
    )
    
    assert res == mock_data
    print("PASSED test_ai_analysis_caching")


if __name__ == "__main__":
    test_fallback_when_no_api_key()
    test_ai_analysis_caching()
    print("All AI service tests passed successfully!")
