"""
CaliComp Engine — The primary orchestration interface.

Provides a single entry point for:
  1. Ingesting raw financial data (CSV files)
  2. Normalizing heterogeneous transaction formats
  3. Deduplicating and reconciling entries
  4. Computing liquidity runway (days-to-zero)
  5. LP-based payment prioritization with explainability
"""

from __future__ import annotations

import csv
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from calicomp.liquidity.runway import RunwayCalculator
from calicomp.solver.prioritizer import PaymentPrioritizer
from calicomp.explainability.explainer import DecisionExplainer


# ── Data Models ────────────────────────────────────────────────────────────────


@dataclass
class Transaction:
    """Represents a single normalized financial transaction."""

    id: str
    date: date
    description: str
    amount: float
    category: str
    source: str
    direction: str  # "inflow" | "outflow"
    raw_data: dict = field(default_factory=dict)

    @property
    def is_inflow(self) -> bool:
        return self.direction == "inflow"

    @property
    def is_outflow(self) -> bool:
        return self.direction == "outflow"


# ── Engine ─────────────────────────────────────────────────────────────────────


class CaliCompEngine:
    """
    Semi-autonomous cash flow intelligence engine.

    Usage:
        engine = CaliCompEngine()
        transactions = engine.ingest("bank_statement.csv")
        normalized = engine.normalize(transactions)
        runway = engine.compute_runway(normalized)
        result = engine.prioritize(obligations, available_cash=50000.0)
    """

    CATEGORY_KEYWORDS: dict[str, list[str]] = {
        "payroll": ["salary", "wage", "payroll", "compensation"],
        "rent": ["rent", "lease", "office space"],
        "utilities": ["electric", "water", "gas", "internet", "phone", "utility"],
        "software": ["subscription", "saas", "license", "software", "cloud"],
        "revenue": ["payment received", "invoice paid", "revenue", "income", "deposit"],
        "tax": ["tax", "irs", "gst", "vat"],
        "supplies": ["supplies", "office", "equipment", "hardware"],
        "marketing": ["ads", "advertising", "marketing", "campaign", "social media"],
        "travel": ["travel", "flight", "hotel", "uber", "lyft", "taxi"],
        "insurance": ["insurance", "premium", "coverage"],
    }

    def __init__(self) -> None:
        self._runway_calculator = RunwayCalculator()
        self._prioritizer = PaymentPrioritizer()
        self._explainer = DecisionExplainer()

    # ── Ingestion ──────────────────────────────────────────────────────────────

    def ingest(self, file_path: str | Path) -> list[dict]:
        """
        Ingest a CSV bank statement and return raw transaction dicts.

        Expected CSV columns (case-insensitive, flexible):
            date, description, amount, type/direction

        Args:
            file_path: Path to the CSV file.

        Returns:
            List of raw transaction dictionaries.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the CSV lacks required columns.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")

        transactions: list[dict] = []

        with open(path, newline="", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)

            if reader.fieldnames is None:
                raise ValueError("CSV file is empty or has no headers.")

            # Normalize header names to lowercase
            headers = [h.strip().lower() for h in reader.fieldnames]
            required = {"date", "description", "amount"}
            if not required.issubset(set(headers)):
                missing = required - set(headers)
                raise ValueError(f"CSV missing required columns: {missing}")

            for row_num, row in enumerate(reader, start=1):
                # Normalize keys
                normalized_row = {k.strip().lower(): v.strip() for k, v in row.items()}
                normalized_row["_row_number"] = row_num
                transactions.append(normalized_row)

        return transactions

    # ── Normalization ──────────────────────────────────────────────────────────

    def normalize(self, raw_transactions: list[dict]) -> list[Transaction]:
        """
        Normalize raw transaction dicts into structured Transaction objects.

        Handles:
          - Date parsing (multiple formats)
          - Amount standardization (absolute values, direction detection)
          - Category inference from description keywords
          - Deterministic ID generation for deduplication

        Args:
            raw_transactions: List of dicts from ingest().

        Returns:
            Deduplicated list of Transaction objects sorted by date.
        """
        seen_ids: set[str] = set()
        transactions: list[Transaction] = []

        for raw in raw_transactions:
            parsed_date = self._parse_date(raw.get("date", ""))
            description = raw.get("description", "").strip()
            amount = self._parse_amount(raw.get("amount", "0"))
            direction = self._detect_direction(raw, amount)
            category = self._categorize(description)

            # Generate deterministic ID for dedup
            id_seed = f"{parsed_date.isoformat()}|{description}|{abs(amount):.2f}"
            txn_id = hashlib.sha256(id_seed.encode()).hexdigest()[:16]

            if txn_id in seen_ids:
                continue  # Skip duplicate
            seen_ids.add(txn_id)

            transactions.append(
                Transaction(
                    id=txn_id,
                    date=parsed_date,
                    description=description,
                    amount=abs(amount),
                    category=category,
                    source=raw.get("source", "csv"),
                    direction=direction,
                    raw_data=raw,
                )
            )

        # Sort by date ascending
        transactions.sort(key=lambda t: t.date)
        return transactions

    # ── Liquidity Runway ───────────────────────────────────────────────────────

    def compute_runway(self, transactions: list[dict]) -> dict:
        """
        Compute the liquidity runway (days-to-zero).

        Accepts raw transaction dicts with keys: amount, date, type.
        Delegates to RunwayCalculator for day-by-day balance simulation.

        Args:
            transactions: List of dicts with "amount", "date", "type".

        Returns:
            dict with "days_to_zero", "daily_balances", "critical_date".
        """
        return self._runway_calculator.compute(transactions=transactions)

    # ── Payment Prioritization with Explainability ─────────────────────────────

    def prioritize(self, obligations: list[dict], available_cash: float) -> dict:
        """
        Prioritize obligations using LP solver and attach explanations.

        Accepts obligation dicts with keys: id, amount, due_days, penalty, flexible.
        Returns combined result with priorities and human-readable explanations.

        Args:
            obligations: List of obligation dicts.
            available_cash: Maximum budget for payments.

        Returns:
            dict with:
                - "priorities"    (dict): solver output (selected_payments, priority_order, scoring_matrix)
                - "explanations"  (list[str]): human-readable explanation per obligation
        """
        priorities = self._prioritizer.solve(
            obligations=obligations,
            available_cash=available_cash,
        )

        explanations = self._explainer.explain(
            scoring_matrix=priorities["scoring_matrix"],
        )

        return {
            "priorities": priorities,
            "explanations": explanations,
        }

    # ── Private Helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _parse_date(date_str: str) -> date:
        """Parse a date string trying multiple common formats."""
        formats = [
            "%Y-%m-%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
            "%m-%d-%Y",
            "%d-%m-%Y",
            "%B %d, %Y",
            "%b %d, %Y",
        ]
        date_str = date_str.strip()
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        raise ValueError(f"Unable to parse date: '{date_str}'")

    @staticmethod
    def _parse_amount(amount_str: str) -> float:
        """Parse a currency string into a float."""
        cleaned = amount_str.replace("$", "").replace(",", "").replace(" ", "").strip()
        if not cleaned:
            return 0.0
        return float(cleaned)

    @staticmethod
    def _detect_direction(raw: dict, amount: float) -> str:
        """Detect whether a transaction is an inflow or outflow."""
        # Check for explicit type/direction column
        explicit = raw.get("type", raw.get("direction", "")).strip().lower()
        if explicit in ("credit", "inflow", "income", "deposit"):
            return "inflow"
        if explicit in ("debit", "outflow", "expense", "withdrawal"):
            return "outflow"
        # Fall back to sign
        return "inflow" if amount >= 0 else "outflow"

    @classmethod
    def _categorize(cls, description: str) -> str:
        """Categorize a transaction based on keyword matching."""
        desc_lower = description.lower()
        for category, keywords in cls.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in desc_lower:
                    return category
        return "general"
