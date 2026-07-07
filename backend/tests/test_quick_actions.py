import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Adjust path to import from backend app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.gmail_service import set_email_starred, set_email_read, set_email_archived

class TestQuickActions(unittest.TestCase):

    @patch("app.services.gmail_service.build")
    def test_set_email_starred(self, mock_build):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_modify = mock_service.users().messages().modify
        mock_modify.return_value.execute.return_value = {"id": "msg_123", "labelIds": ["STARRED"]}
        
        # Test adding star
        mock_credentials = MagicMock()
        res = set_email_starred(mock_credentials, "msg_123", True)
        self.assertEqual(res, {"id": "msg_123", "labelIds": ["STARRED"]})
        mock_modify.assert_called_with(
            userId="me",
            id="msg_123",
            body={"addLabelIds": ["STARRED"]}
        )
        
        # Test removing star
        res = set_email_starred(mock_credentials, "msg_123", False)
        mock_modify.assert_called_with(
            userId="me",
            id="msg_123",
            body={"removeLabelIds": ["STARRED"]}
        )
        print("PASSED TestQuickActions.test_set_email_starred")

    @patch("app.services.gmail_service.build")
    def test_set_email_read(self, mock_build):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_modify = mock_service.users().messages().modify
        mock_modify.return_value.execute.return_value = {"id": "msg_123", "labelIds": []}
        
        # Test marking read (removes UNREAD label)
        mock_credentials = MagicMock()
        res = set_email_read(mock_credentials, "msg_123", True)
        mock_modify.assert_called_with(
            userId="me",
            id="msg_123",
            body={"removeLabelIds": ["UNREAD"]}
        )
        
        # Test marking unread (adds UNREAD label)
        res = set_email_read(mock_credentials, "msg_123", False)
        mock_modify.assert_called_with(
            userId="me",
            id="msg_123",
            body={"addLabelIds": ["UNREAD"]}
        )
        print("PASSED TestQuickActions.test_set_email_read")

    @patch("app.services.gmail_service.build")
    def test_set_email_archived(self, mock_build):
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        mock_modify = mock_service.users().messages().modify
        mock_modify.return_value.execute.return_value = {"id": "msg_123", "labelIds": []}
        
        # Test archiving (removes INBOX label)
        mock_credentials = MagicMock()
        res = set_email_archived(mock_credentials, "msg_123", True)
        mock_modify.assert_called_with(
            userId="me",
            id="msg_123",
            body={"removeLabelIds": ["INBOX"]}
        )
        
        # Test undoing archive (adds INBOX label)
        res = set_email_archived(mock_credentials, "msg_123", False)
        mock_modify.assert_called_with(
            userId="me",
            id="msg_123",
            body={"addLabelIds": ["INBOX"]}
        )
        print("PASSED TestQuickActions.test_set_email_archived")

if __name__ == "__main__":
    unittest.main()
