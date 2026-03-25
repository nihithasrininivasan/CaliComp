"""
CaliComp Email Generator — AI-based communication layer.

Generates context-aware, professional emails based on decision outcomes
and relationship types. Uses an LLM (e.g., OpenAI) to draft the email.
"""

from __future__ import annotations

import os

try:
    import openai
except ImportError:
    openai = None


class EmailGenerator:
    """
    Generates action emails for financial obligations.
    """

    TONE_MAP = {
        "vendor": "polite, respectful, and professional",
        "bank": "formal, highly professional, and precise",
        "employee": "friendly, transparent, but professional",
    }

    def generate_email(self, name: str, amount: float, decision: str, relationship: str) -> dict:
        """
        Generate a professional email based on the prioritization decision.

        Args:
            name: Recipient name (e.g., "ABC Suppliers").
            amount: Payment amount.
            decision: "selected" (payment logic) or "deferred" (delay logic).
            relationship: "vendor", "bank", or "employee".

        Returns:
            dict containing "email" text and the "tone" used.
        """
        tone = self.TONE_MAP.get(relationship.strip().lower(), "professional")
        is_deferred = (decision.strip().lower() == "deferred")

        # ── Construct dynamic prompt ──────────────────────────────────────────

        if is_deferred:
            action_description = "delayed due to temporary cash flow constraints"
        else:
            action_description = "processed and will be paid shortly"

        prompt = (
            f"Write a professional email to {name}. "
            f"The payment of ${amount:.2f} is being {action_description}. "
            f"Use a {tone} tone appropriate for a {relationship} relationship."
        )

        # ── LLM call (with safe fallback) ─────────────────────────────────────

        email_content = ""
        api_key = os.getenv("OPENAI_API_KEY")

        if openai and api_key:
            try:
                # Stub for OpenAI API
                client = openai.OpenAI(api_key=api_key)
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a professional finance assistant drafting direct, concise emails."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=250,
                    temperature=0.7,
                )
                if response.choices and response.choices[0].message.content:
                    email_content = response.choices[0].message.content.strip()
            except Exception:
                # Silently catch API errors and drop to fallback
                pass

        # Fallback if API fails, key is missing, or package is missing
        if not email_content:
            email_content = self._generate_fallback(name, amount, is_deferred)

        return {
            "email": email_content,
            "tone": tone
        }

    def _generate_fallback(self, name: str, amount: float, is_deferred: bool) -> str:
        """Fallback rule-based message when LLM fails or is unavailable."""
        if is_deferred:
            return (
                f"Subject: Update on Payment\n\n"
                f"Dear {name},\n\n"
                f"We are writing to inform you that your payment of ${amount:.2f} "
                f"is currently experiencing a slight delay due to temporary cash flow constraints. "
                f"We appreciate your patience and will provide an update soon.\n\n"
                f"Best regards,\nCaliComp Finance Team"
            )
        else:
            return (
                f"Subject: Payment Confirmation\n\n"
                f"Dear {name},\n\n"
                f"We are pleased to inform you that your payment of ${amount:.2f} "
                f"has been processed and will be transferred shortly.\n\n"
                f"Thank you,\nCaliComp Finance Team"
            )
