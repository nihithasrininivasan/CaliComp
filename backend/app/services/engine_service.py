"""
CaliComp Engine Service — Backend service layer.

Acts as the bridge between FastAPI routes and the CaliComp SDK.
Converts API payloads into SDK calls and serializes results.
No direct solver or financial logic here — only SDK delegation.
"""

from __future__ import annotations

from typing import Any

from calicomp import CaliCompEngine


class EngineService:
    """
    Service layer wrapping the CaliComp SDK for use by API routes.

    Responsibilities:
      - Instantiate and manage the CaliCompEngine
      - Convert raw API dicts into SDK-compatible structures
      - Serialize SDK results back to JSON-friendly dicts
    """

    def __init__(self) -> None:
        self._engine = CaliCompEngine()

    def ingest_and_normalize(self, file_path: str) -> list[dict[str, Any]]:
        """
        Ingest a CSV file and return normalized transactions as dicts.

        Args:
            file_path: Path to the uploaded CSV file.

        Returns:
            List of serialized Transaction dicts.
        """
        raw = self._engine.ingest(file_path)
        normalized = self._engine.normalize(raw)
        return [
            {
                "id": t.id,
                "date": t.date.isoformat(),
                "description": t.description,
                "amount": t.amount,
                "category": t.category,
                "source": t.source,
                "direction": t.direction,
            }
            for t in normalized
        ]

    def get_runway(self, data: list[dict]) -> dict[str, Any]:
        """
        Compute liquidity runway from raw transaction dicts.

        Args:
            data: List of transaction dicts with "amount", "date", "type".

        Returns:
            dict with "days_to_zero", "daily_balances", "critical_date".
        """
        return self._engine.compute_runway(transactions=data)

    def get_priorities(self, data: dict[str, Any]) -> dict[str, Any]:
        """
        Prioritize obligations with explainability.

        Args:
            data: Dict containing:
                - "obligations"    (list[dict]): obligation records
                - "available_cash" (float):      budget for payments

        Returns:
            dict with "priorities" and "explanations".
        """
        obligations = data["obligations"]
        available_cash = float(data["available_cash"])
        return self._engine.prioritize(
            obligations=obligations,
            available_cash=available_cash,
        )
