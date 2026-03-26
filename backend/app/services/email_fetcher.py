import base64
import re
from datetime import datetime
from googleapiclient.discovery import build

from app.services.gmail_auth import authenticate_gmail

def strip_tags(text: str) -> str:
    """Removes HTML tags safely."""
    return re.sub('<.*?>', '', text)

class EmailFetcher:
    """Fetches and extracts email data."""

    def __init__(self):
        self.creds = authenticate_gmail()
        self.service = build("gmail", "v1", credentials=self.creds)

    def fetch_messages(self, query="(debited OR credited OR INR OR Rs) newer_than:1d", max_results=10):
        try:
            results = self.service.users().messages().list(
                userId="me", q=query, maxResults=max_results, labelIds=["INBOX"]
            ).execute()
            messages = results.get("messages", [])
            
            if not messages:
                results = self.service.users().messages().list(
                    userId="me", q=query, maxResults=max_results, labelIds=["INBOX", "SENT"]
                ).execute()
                messages = results.get("messages", [])
                
            print(f"\n[DEBUG] MESSAGES: {messages}")
            return messages
        except Exception as e:
            print(f"Error fetching messages: {e}")
            return []

    def get_email_body(self, msg_id: str) -> dict:
        try:
            print(f"\n[DEBUG] MESSAGE ID: {msg_id}")
            msg = self.service.users().messages().get(
                userId="me", id=msg_id, format="full"
            ).execute()

            headers = msg.get("payload", {}).get("headers", [])
            subject = "No Subject"
            for header in headers:
                if header["name"].lower() == "subject":
                    subject = header["value"]
                    break
            
            print(f"SUBJECT: {subject}")

            internal_date = msg.get("internalDate")
            date_str = ""
            if internal_date:
                dt = datetime.fromtimestamp(int(internal_date) / 1000)
                date_str = dt.strftime("%Y-%m-%d")

            payload = msg.get("payload", {})
            parts = payload.get("parts", [])
            
            raw_text = ""
            cleaned_text = ""

            def extract_data(part):
                data = part.get("body", {}).get("data")
                if data:
                    return base64.urlsafe_b64decode(data).decode(errors="ignore")
                return ""

            if parts:
                for p in parts:
                    if p.get("mimeType") == "text/plain":
                        raw_text = extract_data(p)
                        cleaned_text = raw_text
                        break
                if not raw_text:
                    for p in parts:
                        if p.get("mimeType") == "text/html":
                            raw_text = extract_data(p)
                            cleaned_text = strip_tags(raw_text)
                            break
                            
            if not raw_text:
                data = payload.get("body", {}).get("data")
                if data:
                    raw_text = base64.urlsafe_b64decode(data).decode(errors="ignore")
                    if payload.get("mimeType") == "text/html":
                        cleaned_text = strip_tags(raw_text)
                    else:
                        cleaned_text = raw_text

            if not raw_text:
                print("NO BODY FOUND")
            else:
                print(f"RAW BODY: {raw_text[:200]}")
                print(f"CLEAN TEXT: {cleaned_text[:200]}")

            return {"date": date_str, "text": cleaned_text.strip(), "subject": subject}
        except Exception as e:
            print(f"[DEBUG] Error reading message {msg_id}: {e}")
            return {"date": "", "text": "", "subject": ""}

    def fetch_emails(self) -> list[dict]:
        messages = self.fetch_messages()
        emails = []
        for msg in messages:
            data = self.get_email_body(msg["id"])
            if data["text"] or data["subject"]:
                emails.append(data)
        return emails