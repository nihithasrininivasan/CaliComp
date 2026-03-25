"""
CaliComp Liquidity Runway Calculator.

Computes the "days-to-zero" metric: how many days until the current
balance is depleted, based on historical net burn rate.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from calicomp.interfaces.engine import Transaction


@dataclass
class RunwayResult:
    """Result of a liquidity runway computation."""

    days_to_zero: float
    daily_burn_rate: float
    daily_inflow: float
    daily_outflow: float
    net_daily_rate: float
    current_balance: float
    lookback_days: int
    analysis_start: date
    analysis_end: date
    explanation: str
    inflow_transactions: int = 0
    outflow_transactions: int = 0


class RunwayCalculator:
    """
    Deterministic liquidity runway calculator.

    Methodology:
      1. Filter transactions within the lookback window.
      2. Compute average daily inflows and outflows.
      3. Derive the net daily burn rate.
      4. Project days until balance reaches zero.
    """

    def compute(
        self,
        transactions: list,  # list[Transaction]
        current_balance: float,
        lookback_days: int = 30,
    ) -> RunwayResult:
        """
        Compute the liquidity runway.

        Args:
            transactions: Normalized transaction list.
            current_balance: Current account balance.
            lookback_days: Historical window for burn rate calculation.

        Returns:
            RunwayResult with detailed breakdown and explanation.
        """
        if current_balance <= 0:
            return self._zero_balance_result(current_balance, lookback_days)

        today = date.today()
        cutoff = today - timedelta(days=lookback_days)

        # Filter transactions in the lookback window
        recent = [t for t in transactions if t.date >= cutoff]

        total_inflows = sum(t.amount for t in recent if t.is_inflow)
        total_outflows = sum(t.amount for t in recent if t.is_outflow)
        inflow_count = sum(1 for t in recent if t.is_inflow)
        outflow_count = sum(1 for t in recent if t.is_outflow)

        # Compute the actual number of days covered
        if recent:
            earliest = min(t.date for t in recent)
            latest = max(t.date for t in recent)
            actual_days = max((latest - earliest).days, 1)
        else:
            actual_days = lookback_days

        daily_inflow = total_inflows / actual_days
        daily_outflow = total_outflows / actual_days
        net_daily_rate = daily_outflow - daily_inflow  # positive = net burn

        # Calculate days to zero
        if net_daily_rate <= 0:
            # Net positive or neutral — balance is not decreasing
            days_to_zero = float("inf")
        else:
            days_to_zero = current_balance / net_daily_rate

        # Build explanation
        explanation = self._build_explanation(
            current_balance=current_balance,
            daily_inflow=daily_inflow,
            daily_outflow=daily_outflow,
            net_daily_rate=net_daily_rate,
            days_to_zero=days_to_zero,
            lookback_days=lookback_days,
            inflow_count=inflow_count,
            outflow_count=outflow_count,
        )

        return RunwayResult(
            days_to_zero=round(days_to_zero, 1) if not math.isinf(days_to_zero) else days_to_zero,
            daily_burn_rate=round(net_daily_rate, 2),
            daily_inflow=round(daily_inflow, 2),
            daily_outflow=round(daily_outflow, 2),
            net_daily_rate=round(net_daily_rate, 2),
            current_balance=current_balance,
            lookback_days=lookback_days,
            analysis_start=cutoff,
            analysis_end=today,
            explanation=explanation,
            inflow_transactions=inflow_count,
            outflow_transactions=outflow_count,
        )

    def _zero_balance_result(self, balance: float, lookback_days: int) -> RunwayResult:
        """Return result for zero or negative balance."""
        today = date.today()
        return RunwayResult(
            days_to_zero=0.0,
            daily_burn_rate=0.0,
            daily_inflow=0.0,
            daily_outflow=0.0,
            net_daily_rate=0.0,
            current_balance=balance,
            lookback_days=lookback_days,
            analysis_start=today - timedelta(days=lookback_days),
            analysis_end=today,
            explanation=(
                f"⚠️ Current balance is ${balance:,.2f}. "
                "The account has already reached or breached zero. "
                "Immediate action is required to restore positive cash flow."
            ),
        )

    @staticmethod
    def _build_explanation(
        current_balance: float,
        daily_inflow: float,
        daily_outflow: float,
        net_daily_rate: float,
        days_to_zero: float,
        lookback_days: int,
        inflow_count: int,
        outflow_count: int,
    ) -> str:
        """Build a human-readable explanation of the runway analysis."""
        lines = [
            f"📊 **Liquidity Runway Analysis** (last {lookback_days} days)",
            f"",
            f"• Current Balance: ${current_balance:,.2f}",
            f"• Avg Daily Inflows:  ${daily_inflow:,.2f} ({inflow_count} transactions)",
            f"• Avg Daily Outflows: ${daily_outflow:,.2f} ({outflow_count} transactions)",
            f"• Net Daily Burn: ${net_daily_rate:,.2f}",
            f"",
        ]

        if math.isinf(days_to_zero):
            lines.append(
                "✅ Your inflows exceed or match your outflows. "
                "At this rate, your balance will not reach zero."
            )
        elif days_to_zero <= 7:
            lines.append(
                f"🔴 CRITICAL: Only **{days_to_zero:.0f} days** of runway remaining. "
                "Immediate action is necessary — consider pausing non-essential spending "
                "or accelerating receivables."
            )
        elif days_to_zero <= 30:
            lines.append(
                f"🟡 WARNING: **{days_to_zero:.0f} days** of runway remaining. "
                "Review upcoming payables and consider deferring non-critical expenses."
            )
        else:
            lines.append(
                f"🟢 HEALTHY: **{days_to_zero:.0f} days** of runway. "
                "Cash position is stable. Continue monitoring weekly."
            )

        return "\n".join(lines)
