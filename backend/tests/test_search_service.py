import sys
import os
from datetime import datetime, timezone, timedelta

# Adjust path to import from backend app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.search_service import (
    match_email,
    filter_emails_semantically,
)

# Mock emails
MOCK_EMAILS = [
    {
        "id": "1",
        "sender": "GitHub <noreply@github.com>",
        "subject": "[GitHub] Security Alert: vulnerability detected",
        "snippet": "We found a known vulnerability in one of your dependencies.",
        "received_at": datetime.now(timezone.utc).isoformat(),
        "priority": "Important",
        "aiSummary": ["Vulnerability found in dependency", "Update library to patch"],
    },
    {
        "id": "2",
        "sender": "LinkedIn <messages-noreply@linkedin.com>",
        "subject": "John Doe viewed your profile",
        "snippet": "See who viewed your LinkedIn profile and get noticed.",
        "received_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "priority": "Normal",
        "aiSummary": "Your LinkedIn profile visibility is growing.",
    },
    {
        "id": "3",
        "sender": "Promotions Daily <deals@dailydeals.com>",
        "subject": "Save 50% on your next purchase!",
        "snippet": "Don't miss out on this limited-time cash back voucher offer.",
        "received_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
        "priority": "Low Priority",
        "category": "Promotions",
        "aiSummary": ["Low priority promotional deal", "Discount code inside"],
    },
    {
        "id": "4",
        "sender": "Recruiter <hr@company.com>",
        "subject": "InboxIQ Interview Schedule",
        "snippet": "We would like to invite you for a coding round coding test assessment.",
        "received_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
        "priority": "Urgent",
        "aiSummary": ["Urgent recruitment assessment invitation", "Schedule slot for coding test"],
    }
]


def test_search_github():
    # Matches "github" in sender
    results = filter_emails_semantically(MOCK_EMAILS, "github")
    assert len(results) == 1
    assert results[0]["id"] == "1"
    print("PASSED test_search_github")


def test_search_linkedin():
    # Matches "linkedin" in sender/snippet
    results = filter_emails_semantically(MOCK_EMAILS, "linkedin")
    assert len(results) == 1
    assert results[0]["id"] == "2"
    print("PASSED test_search_linkedin")


def test_search_urgent():
    # Matches Urgent priority
    results = filter_emails_semantically(MOCK_EMAILS, "urgent")
    assert len(results) == 1
    assert results[0]["id"] == "4"
    print("PASSED test_search_urgent")


def test_search_important():
    # Matches Important priority
    results = filter_emails_semantically(MOCK_EMAILS, "important")
    assert len(results) == 1
    assert results[0]["id"] == "1"
    print("PASSED test_search_important")


def test_search_promotion():
    # Matches Low Priority or Promotions category
    results = filter_emails_semantically(MOCK_EMAILS, "promotion")
    assert len(results) == 1
    assert results[0]["id"] == "3"
    print("PASSED test_search_promotion")


def test_search_today():
    # Matches emails received today (Email 1)
    results = filter_emails_semantically(MOCK_EMAILS, "today")
    assert len(results) == 1
    assert results[0]["id"] == "1"
    print("PASSED test_search_today")


def test_search_yesterday():
    # Matches emails received yesterday (Email 2)
    results = filter_emails_semantically(MOCK_EMAILS, "yesterday")
    assert len(results) == 1
    assert results[0]["id"] == "2"
    print("PASSED test_search_yesterday")


def test_search_security():
    # Matches security patterns (vulnerability, alert, etc.) -> Email 1
    results = filter_emails_semantically(MOCK_EMAILS, "security alerts")
    assert len(results) == 1
    assert results[0]["id"] == "1"
    print("PASSED test_search_security")


def test_search_interview():
    # Matches interview patterns (coding round, schedule, etc.) -> Email 4
    results = filter_emails_semantically(MOCK_EMAILS, "interview")
    assert len(results) == 1
    assert results[0]["id"] == "4"
    print("PASSED test_search_interview")


def test_search_keyword_fallback():
    # General keyword fallback: "voucher" -> Email 3
    results = filter_emails_semantically(MOCK_EMAILS, "voucher")
    assert len(results) == 1
    assert results[0]["id"] == "3"
    print("PASSED test_search_keyword_fallback")


if __name__ == "__main__":
    test_search_github()
    test_search_linkedin()
    test_search_urgent()
    test_search_important()
    test_search_promotion()
    test_search_today()
    test_search_yesterday()
    test_search_security()
    test_search_interview()
    test_search_keyword_fallback()
    print("All search service tests passed successfully!")
