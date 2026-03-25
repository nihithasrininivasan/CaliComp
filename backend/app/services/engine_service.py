"""
CaliComp Engine Service — Backend service layer.

Acts as the bridge between FastAPI routes and the CaliComp SDK.
Converts API payloads into SDK calls and serializes results.
"""

from __future__ import annotations

from dataclasses import asdict
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

    def compute_runway(
        self,
        transactions: list[dict],
        current_balance: float,
        lookback_days: int = 30,
    ) -> dict[str, Any]:
        """
        Compute liquidity runway from API transaction payloads.

        Args:
            transactions: List of transaction dicts from the API.
            current_balance: Current account balance.
            lookback_days: Lookback window for burn rate.

        Returns:
            Serialized RunwayResult dict.
        """
        # Convert API dicts → SDK raw format → normalized Transaction objects
        normalized = self._engine.normalize(transactions)

        result = self._engine.compute_runway(
            transactions=normalized,
            current_balance=current_balance,
            lookback_days=lookback_days,
        )

        result_dict = asdict(result)
        # Convert date objects to ISO strings
        result_dict["analysis_start"] = result.analysis_start.isoformat()
        result_dict["analysis_end"] = result.analysis_end.isoformat()
        return result_dict

    def prioritize(
        self,
        transactions: list[dict],
        available_balance: float,
    ) -> dict[str, Any]:
        """
        Prioritize payments from API transaction payloads.

        Args:
            transactions: List of transaction dicts from the API.
            available_balance: Budget for payments.

        Returns:
            Serialized PrioritizationResult dict.
        """
        normalized = self._engine.normalize(transactions)

        result = self._engine.prioritize(
            transactions=normalized,
            available_balance=available_balance,
        )

        return asdict(result)
