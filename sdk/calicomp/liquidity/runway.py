"""
CaliComp Liquidity Runway Calculator.

Computes the "days-to-zero" metric by simulating daily running balances
from a list of dated transactions. Fully deterministic — no AI/LLM.

Input:
    List of transaction dicts with keys: amount, date (YYYY-MM-DD), type (credit|debit).

Output:
    Dict with days_to_zero, daily_balances, critical_date.
"""

from __future__ import annotations

from datetime import datetime, timedelta


class RunwayCalculator:
    """
    Deterministic liquidity runway engine.

    Methodology:
      1. Sort transactions by date ascending.
      2. Build a day-by-day running balance starting from 0.
      3. On each calendar day, apply all credits (+) and debits (-).
      4. The first day the cumulative balance drops below 0 is the critical date.
      5. days_to_zero = offset (in days) from the first transaction date.
    """

    def compute(self, transactions: list[dict]) -> dict:
        """
        Compute the liquidity runway from raw transaction dicts.

        Args:
            transactions: List of dicts, each with:
                - "amount"  (float): transaction value (always positive)
                - "date"    (str):   ISO date string YYYY-MM-DD
                - "type"    (str):   "credit" or "debit"

        Returns:
            dict with:
                - "days_to_zero"   (int | None): day index when balance < 0, or None
                - "daily_balances" (list[dict]): [{"date": str, "balance": float, "is_critical": bool}]
                - "critical_date"  (str | None): ISO date when balance < 0, or None
                - "status"         (str):        "critical" if balance goes negative, else "safe"
        """
        if not transactions:
            return {
                "days_to_zero": None,
                "daily_balances": [],
                "critical_date": None,
                "status": "safe",
            }

        # ── Parse & sort by date ───────────────────────────────────────────────

        parsed = []
        for txn in transactions:
            dt = datetime.strptime(str(txn["date"]).strip(), "%Y-%m-%d").date()
            amount = float(txn["amount"])
            txn_type = str(txn.get("type", "debit")).strip().lower()
            parsed.append({"date": dt, "amount": amount, "type": txn_type})

        parsed.sort(key=lambda t: t["date"])

        # ── Build daily net-change map ─────────────────────────────────────────

        start_date = parsed[0]["date"]
        end_date = parsed[-1]["date"]

        daily_net: dict = {}
        for txn in parsed:
            d = txn["date"]
            signed = txn["amount"] if txn["type"] == "credit" else -txn["amount"]
            daily_net[d] = daily_net.get(d, 0.0) + signed

        # ── Walk calendar day-by-day ───────────────────────────────────────────

        running_balance = 0.0
        daily_balances: list[dict] = []
        days_to_zero: int | None = None
        critical_date: str | None = None

        total_days = (end_date - start_date).days + 1
        for day_offset in range(total_days):
            current_date = start_date + timedelta(days=day_offset)
            running_balance += daily_net.get(current_date, 0.0)

            is_critical = running_balance < 0 and days_to_zero is None

            daily_balances.append({
                "date": current_date.isoformat(),
                "balance": float(round(running_balance, 2)),
                "is_critical": is_critical,
            })

            if is_critical:
                days_to_zero = day_offset
                critical_date = current_date.isoformat()

        return {
            "days_to_zero": days_to_zero,
            "daily_balances": daily_balances,
            "critical_date": critical_date,
            "status": "critical" if days_to_zero is not None else "safe",
        }
