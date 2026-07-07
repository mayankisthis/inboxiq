import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Adjust path to import from backend app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.reply_send_service import send_email_reply, _extract_header

class TestReplySendService(unittest.TestCase):

    @patch("app.services.reply_send_service.build")
    def test_send_email_reply_threading(self, mock_build):
        # 1. Setup mock Gmail API client and responses
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        # Mock original message details response
        mock_msg_response = {
            "threadId": "thread_12345",
            "payload": {
                "headers": [
                    {"name": "Message-ID", "value": "<message_orig_id@gmail.com>"},
                    {"name": "Subject", "value": "Project Sync Meeting"},
                    {"name": "From", "value": "Jane Client <jane@client.com>"},
                    {"name": "To", "value": "User <user@me.com>"},
                    {"name": "Cc", "value": "Team <team@me.com>"},
                    {"name": "References", "value": "<ref_id_one@gmail.com>"},
                ]
            }
        }
        mock_service.users().messages().get().execute.return_value = mock_msg_response
        
        # Mock getProfile response
        mock_profile_response = {
            "emailAddress": "user@me.com"
        }
        mock_service.users().getProfile().execute.return_value = mock_profile_response
        
        # Mock messages.send response
        mock_send_response = {
            "id": "reply_id_67890",
            "threadId": "thread_12345"
        }
        mock_service.users().messages().send().execute.return_value = mock_send_response
        
        # 2. Invoke send_email_reply
        mock_credentials = MagicMock()
        res = send_email_reply(mock_credentials, "msg_123", "Sure, sounds good!")
        
        # 3. Assertions
        # Assert returned result is from send response
        self.assertEqual(res, mock_send_response)
        
        # Get send call payload
        send_call_args = mock_service.users().messages().send.call_args
        self.assertIsNotNone(send_call_args)
        
        body_payload = send_call_args[1]["body"]
        self.assertEqual(body_payload["threadId"], "thread_12345")
        
        # Decode RFC2822 raw message to verify headers
        import base64
        from email import message_from_bytes
        raw_bytes = base64.urlsafe_b64decode(body_payload["raw"])
        sent_mime = message_from_bytes(raw_bytes)
        
        # Verify subject prefixing, recipients, and threading headers
        self.assertEqual(sent_mime["To"], "Jane Client <jane@client.com>")
        self.assertEqual(sent_mime["Cc"], "Team <team@me.com>")
        self.assertEqual(sent_mime["Subject"], "Re: Project Sync Meeting")
        self.assertEqual(sent_mime["In-Reply-To"], "<message_orig_id@gmail.com>")
        self.assertEqual(sent_mime["References"], "<ref_id_one@gmail.com> <message_orig_id@gmail.com>")
        self.assertEqual(sent_mime.get_payload(), "Sure, sounds good!")
        print("PASSED TestReplySendService.test_send_email_reply_threading")

if __name__ == "__main__":
    unittest.main()
