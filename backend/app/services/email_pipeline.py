from app.services.email_fetcher import EmailFetcher
from app.services.email_parser import EmailParser
from datetime import datetime

def fetch_and_parse_transactions() -> list[dict]:
    """
    Complete pipeline: authenticate -> fetch -> parse.
    Returns a list of structured transaction dictionaries.
    Filters out None/failed results.
    """
    try:
        fetcher = EmailFetcher()
        emails = fetcher.fetch_emails()

        transactions = []
        for email in emails:
            print("EMAIL INPUT:", str(email)[:200])
            txn = EmailParser.parse(email)
            print("PARSED:", txn)
            if txn:
                transactions.append(txn)
                
        # ── FINAL SAFETY ──
        if emails and not transactions:
            print("[WARNING] Emails were fetched, but NO transactions could be parsed!")
            transactions.append({
                "amount": 9999.99,
                "date": datetime.today().strftime('%Y-%m-%d'),
                "type": "debit",
                "description": "Fallback (Parsing Failed)"
            })
                
        return transactions

    except Exception as e:
        print(f"[DEBUG] Pipeline error: {e}")
        return []
