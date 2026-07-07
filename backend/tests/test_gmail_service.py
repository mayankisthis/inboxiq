import sys
import os

# Adjust path to import from backend app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.gmail_service import (
    _decode_base64url,
    _strip_html_tags,
    _extract_email_body,
)

def test_decode_base64url():
    # "Hello World" base64url encoded is "SGVsbG8gV29ybGQ" (no padding)
    assert _decode_base64url("SGVsbG8gV29ybGQ") == "Hello World"
    
    # "aGVsbG8tLXdvcmxkX18" is urlsafe base64 for "hello--world__"
    assert _decode_base64url("aGVsbG8tLXdvcmxkX18") == "hello--world__"
    print("PASSED test_decode_base64url")


def test_strip_html_tags():
    html_input = "Hello<br>World<p>First paragraph.</p><div>Second paragraph.</div>&lt;test&gt;"
    expected = "Hello\nWorld\nFirst paragraph.\n\nSecond paragraph.\n<test>"
    actual = _strip_html_tags(html_input)
    print("ACTUAL:", repr(actual))
    print("EXPECTED:", repr(expected))
    assert actual == expected
    print("PASSED test_strip_html_tags")


def test_extract_email_body_prefer_plain():
    # Payload with both plain and html parts
    payload = {
        "mimeType": "multipart/alternative",
        "parts": [
            {
                "mimeType": "text/html",
                "body": {
                    "data": "PHA+SFRNTCBjb250ZW50PC9wPg=="  # "<p>HTML content</p>"
                }
            },
            {
                "mimeType": "text/plain",
                "body": {
                    "data": "UGxhaW4gdGV4dCBjb250ZW50"  # "Plain text content"
                }
            }
        ]
    }
    body = _extract_email_body(payload, "fallback snippet")
    assert body == "Plain text content"
    print("PASSED test_extract_email_body_prefer_plain")


def test_extract_email_body_fallback_html():
    # Payload with only html part
    payload = {
        "mimeType": "multipart/alternative",
        "parts": [
            {
                "mimeType": "text/html",
                "body": {
                    "data": "PHA+SFRNTCBjb250ZW50PC9wPg=="  # "<p>HTML content</p>"
                }
            }
        ]
    }
    body = _extract_email_body(payload, "fallback snippet")
    assert body == "HTML content"
    print("PASSED test_extract_email_body_fallback_html")


def test_extract_email_body_nested():
    # Deeply nested MIME structures (multipart/mixed -> multipart/alternative -> text/plain)
    payload = {
        "mimeType": "multipart/mixed",
        "parts": [
            {
                "mimeType": "multipart/alternative",
                "parts": [
                    {
                        "mimeType": "text/html",
                        "body": {
                            "data": "PHA+TmVzdGVkIEhUTUw8L3A+"  # "<p>Nested HTML</p>"
                        }
                    },
                    {
                        "mimeType": "text/plain",
                        "body": {
                            "data": "TmVzdGVkIFBsYWlu"  # "Nested Plain"
                        }
                    }
                ]
            },
            {
                "mimeType": "application/pdf",
                "filename": "document.pdf",
                "body": {"size": 1234}
            }
        ]
    }
    body = _extract_email_body(payload, "fallback snippet")
    assert body == "Nested Plain"
    print("PASSED test_extract_email_body_nested")


def test_extract_email_body_fallback_snippet():
    # Empty payload body should fallback to snippet
    payload = {
        "mimeType": "text/plain",
        "body": {}
    }
    body = _extract_email_body(payload, "fallback snippet")
    assert body == "fallback snippet"
    print("PASSED test_extract_email_body_fallback_snippet")


if __name__ == "__main__":
    test_decode_base64url()
    test_strip_html_tags()
    test_extract_email_body_prefer_plain()
    test_extract_email_body_fallback_html()
    test_extract_email_body_nested()
    test_extract_email_body_fallback_snippet()
    print("All tests passed successfully!")
