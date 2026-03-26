import re
from datetime import datetime

class EmailParser:
    """Parses email bodies for financial transactions using robust regex."""

    @staticmethod
    def parse(email_data: dict) -> dict | None:
        raw_text = email_data.get("text", "")
        subject = email_data.get("subject", "")
        
        full_text = f"{subject} {raw_text}"
        if not full_text.strip():
            return None

        # Ensure plain text by stripping HTML tags if present
        text = re.sub('<.*?>', '', full_text).lower()

        # 1. Determine Type
        txn_type = None
        if any(word in text for word in ["debit", "debited", "spent"]):
            txn_type = "debit"
        elif any(word in text for word in ["credit", "credited", "received"]):
            txn_type = "credit"
            
        if not txn_type:
            print("[DEBUG] PARSED: Failed to determine transaction type")
            return None

        # 2. Extract Robust Amount
        # e.g., r"(₹|rs.?|inr)\s?([\d,]+)"
        amount_pattern = r"(₹|rs\.?|inr)\s?([\d,]+)"
        amount_match = re.search(amount_pattern, text)
        if not amount_match:
            print("[DEBUG] PARSED: Failed to extract amount")
            return None

        try:
            amount_str = amount_match.group(2).replace(",", "")
            amount = float(amount_str)
        except ValueError:
            print("[DEBUG] PARSED: Failed to convert amount to float")
            return None

        if amount <= 0:
            print("[DEBUG] PARSED: Amount <= 0 is invalid")
            return None

        # 3. Extract or Fallback Date
        date_str = ""
        date_pattern_1 = r"\b(20\d{2}-\d{2}-\d{2})\b"
        date_match_1 = re.search(date_pattern_1, text)
        
        if date_match_1:
            date_str = date_match_1.group(1)
        else:
            provided_date = email_data.get("date", "")
            if provided_date and re.match(r"^20\d{2}-\d{2}-\d{2}$", provided_date):
                date_str = provided_date
            else:
                date_str = datetime.today().strftime('%Y-%m-%d')

        txn = {
            "amount": amount,
            "date": date_str,
            "type": txn_type,
            "description": "Gmail Ingestion"
        }
        
        return txn
