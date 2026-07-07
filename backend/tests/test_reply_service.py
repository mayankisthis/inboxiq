import sys
import os

# Adjust path to import from backend app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings
from app.services.reply_service import generate_email_reply

def test_reply_fallback_styles():
    original_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = ""
    
    try:
        # Check Professional fallback
        prof = generate_email_reply("John", "Interview Details", "Body", "Professional")
        assert "Hello John" in prof
        assert "Interview Details" in prof
        assert "Best regards" in prof
        
        # Check Friendly fallback
        friend = generate_email_reply("Jane", "Catch up", "Body", "Friendly")
        assert "Hi Jane" in friend
        assert "Catch up" in friend
        assert "Best," in friend
        
        # Check Formal fallback
        form = generate_email_reply("Dr. Smith", "Grant Request", "Body", "Formal")
        assert "Dear Dr. Smith" in form
        assert "Grant Request" in form
        assert "Sincerely" in form
        
        # Check Short fallback
        shrt = generate_email_reply("Boss", "Meeting", "Body", "Short")
        assert "Thanks!" in shrt
        assert "follow up soon" in shrt
        
        print("PASSED test_reply_fallback_styles")
    finally:
        settings.GEMINI_API_KEY = original_key

if __name__ == "__main__":
    test_reply_fallback_styles()
    print("All AI reply service tests passed successfully!")
