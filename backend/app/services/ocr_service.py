import requests
import re
import json
import base64
from typing import Optional, Dict, Any

class OCRService:
    """
    Service to process receipts and invoices using ocr.space API.
    """
    API_KEY = "helloworld"  # Using default free key or user can provide one in .env
    API_URL = "https://api.ocr.space/parse/image"

    @classmethod
    def process_ocr(cls, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Send image to ocr.space and parse results for vendor and amount.
        """
        try:
            # Prepare the request
            payload = {
                "apikey": cls.API_KEY,
                "language": "eng",
                "isOverlayRequired": False,
                "FileType": filename.split('.')[-1].lower() if '.' in filename else 'jpg',
            }
            
            # File content as base64 or multipart
            files = {
                "file": (filename, file_content)
            }
            
            response = requests.post(cls.API_URL, data=payload, files=files, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("OCRExitCode") != 1:
                error = result.get("ErrorMessage", ["Unknown OCR error"])[0]
                raise ValueError(f"OCR failed: {error}")

            parsed_text = result["ParsedResults"][0]["ParsedText"]
            print(f"OCR Parsed Text: {parsed_text}")

            return cls._extract_entities(parsed_text)

        except Exception as e:
            print(f"OCR Processing Error: {str(e)}")
            # Fallback to a structured but empty response or error
            return {
                "vendor": "Unknown Vendor",
                "amount": 0.0,
                "date": "",
                "type": "expense",
                "category": "Uncategorized",
                "confidence": 0.0,
                "error": str(e)
            }

    @classmethod
    def _extract_entities(cls, text: str) -> Dict[str, Any]:
        """
        Heuristic parsing of OCR text to find Amount and Vendor.
        """
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # 1. Vendor is usually the first line with meaningful text
        vendor = lines[0] if lines else "Unknown Vendor"
        
        # 2. Look for amounts (e.g., 500.00, 1,250)
        # Regex for currency-like numbers
        amount_matches = re.findall(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', text)
        
        # Get the largest number (often the total)
        amounts = []
        for m in amount_matches:
            try:
                val = float(m.replace(',', ''))
                # Filter out dates (e.g. 2024 or 2026) or tiny numbers
                if 1.0 < val < 1000000:
                    amounts.append(val)
            except:
                continue
        
        total_amount = max(amounts) if amounts else 0.0
        
        # 3. Look for dates
        date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', text)
        date_str = date_match.group(1) if date_match else ""

        return {
            "vendor": vendor,
            "amount": total_amount,
            "date": date_str,
            "type": "expense",
            "category": "Supplies",
            "confidence": 0.85
        }
