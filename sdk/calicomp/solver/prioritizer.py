"""
CaliComp Payment Prioritizer — Deterministic LP Solver.

Uses PuLP to solve a 0-1 knapsack-style optimization problem:
  Maximize weighted priority of selected payments
  Subject to: total selected ≤ available balance
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

import pulp

if TYPE_CHECKING:
    from calicomp.interfaces.engine import Transaction


# ── Category Priority Weights ──────────────────────────────────────────────────
# Higher weight = more important to pay first

CATEGORY_WEIGHTS: dict[str, float] = {
    "payroll": 10.0,    # Legal obligation — highest priority
    "tax": 9.0,         # Government obligations — severe penalties
    "rent": 8.0,        # Critical operational cost
    "utilities": 7.0,   # Essential services
    "insurance": 6.5,   # Contractual, hard to reinstate
    "software": 5.0,    # Operational dependency
    "supplies": 4.0,    # Can often be deferred
    "marketing": 3.0,   # Discretionary
    "travel": 2.0,      # Highly deferrable
    "general": 1.0,     # Unknown / lowest priority
}


@dataclass
class PrioritizedItem:
    """A single item in the prioritization result."""

    transaction_id: str
    description: str
    amount: float
    category: str
    score: float
    selected: bool
    reason: str


@dataclass
class PrioritizationResult:
    """Complete result of the payment prioritization solver."""

    ranked_items: list[PrioritizedItem] = field(default_factory=list)
    total_selected_amount: float = 0.0
    available_balance: float = 0.0
    remaining_balance: float = 0.0
    solver_status: str = "Not Solved"
    explanation: str = ""


class PaymentPrioritizer:
    """
    Deterministic LP-based payment prioritizer.

    Approach:
      1. Filter outflow transactions only.
      2. Assign priority weights based on category.
      3. Formulate a 0-1 knapsack LP: maximize total priority score
         subject to the budget constraint.
      4. Solve with PuLP's default solver (CBC).
      5. Return ranked results with full explainability.
    """

    def solve(
        self,
        transactions: list,  # list[Transaction]
        available_balance: float,
    ) -> PrioritizationResult:
        """
        Solve the payment prioritization problem.

        Args:
            transactions: Normalized transactions (only outflows are considered).
            available_balance: Maximum budget for payments.

        Returns:
            PrioritizationResult with ranked items and explanation.
        """
        # Filter to outflow transactions only
        outflows = [t for t in transactions if t.is_outflow]

        if not outflows:
            return PrioritizationResult(
                available_balance=available_balance,
                remaining_balance=available_balance,
                solver_status="No outflows",
                explanation="No outflow transactions found to prioritize.",
            )

        # ── Formulate the LP ───────────────────────────────────────────────────

        prob = pulp.LpProblem("PaymentPrioritization", pulp.LpMaximize)

        # Decision variables: binary (pay or don't pay)
        pay_vars: dict[str, pulp.LpVariable] = {}
        for txn in outflows:
            pay_vars[txn.id] = pulp.LpVariable(f"pay_{txn.id}", cat=pulp.LpBinary)

        # Objective: maximize total weighted priority score
        weights = {
            txn.id: CATEGORY_WEIGHTS.get(txn.category, 1.0) for txn in outflows
        }
        prob += pulp.lpSum(
            weights[txn.id] * pay_vars[txn.id] for txn in outflows
        ), "TotalPriorityScore"

        # Constraint: total selected amount ≤ available balance
        prob += (
            pulp.lpSum(txn.amount * pay_vars[txn.id] for txn in outflows)
            <= available_balance
        ), "BudgetConstraint"

        # ── Solve ──────────────────────────────────────────────────────────────

        solver = pulp.PULP_CBC_CMD(msg=0)  # Suppress solver output
        prob.solve(solver)

        status = pulp.LpStatus[prob.status]

        # ── Extract Results ────────────────────────────────────────────────────

        items: list[PrioritizedItem] = []
        total_selected = 0.0

        for txn in outflows:
            is_selected = pulp.value(pay_vars[txn.id]) == 1.0
            weight = weights[txn.id]

            if is_selected:
                total_selected += txn.amount
                reason = (
                    f"✅ SELECTED — Category '{txn.category}' has priority weight "
                    f"{weight:.1f}/10. Included within budget."
                )
            else:
                reason = (
                    f"⏸️ DEFERRED — Category '{txn.category}' (weight {weight:.1f}/10). "
                    f"Excluded to stay within budget of ${available_balance:,.2f}."
                )

            items.append(
                PrioritizedItem(
                    transaction_id=txn.id,
                    description=txn.description,
                    amount=txn.amount,
                    category=txn.category,
                    score=weight,
                    selected=is_selected,
                    reason=reason,
                )
            )

        # Sort: selected first, then by score descending
        items.sort(key=lambda x: (-int(x.selected), -x.score))

        remaining = available_balance - total_selected

        # ── Build Explanation ──────────────────────────────────────────────────

        explanation = self._build_explanation(
            items=items,
            total_selected=total_selected,
            available_balance=available_balance,
            remaining=remaining,
            status=status,
        )

        return PrioritizationResult(
            ranked_items=items,
            total_selected_amount=round(total_selected, 2),
            available_balance=available_balance,
            remaining_balance=round(remaining, 2),
            solver_status=status,
            explanation=explanation,
        )

    @staticmethod
    def _build_explanation(
        items: list[PrioritizedItem],
        total_selected: float,
        available_balance: float,
        remaining: float,
        status: str,
    ) -> str:
        """Build a human-readable explanation of the prioritization."""
        selected = [i for i in items if i.selected]
        deferred = [i for i in items if not i.selected]

        lines = [
            f"🧮 **Payment Prioritization Report**",
            f"",
            f"• Solver Status: {status}",
            f"• Available Budget: ${available_balance:,.2f}",
            f"• Total Selected: ${total_selected:,.2f}",
            f"• Remaining After Selection: ${remaining:,.2f}",
            f"",
            f"**Selected for Payment ({len(selected)}):**",
        ]

        for item in selected:
            lines.append(
                f"  ✅ {item.description}: ${item.amount:,.2f} "
                f"(priority: {item.score:.1f})"
            )

        if deferred:
            lines.append(f"")
            lines.append(f"**Deferred ({len(deferred)}):**")
            for item in deferred:
                lines.append(
                    f"  ⏸️ {item.description}: ${item.amount:,.2f} "
                    f"(priority: {item.score:.1f})"
                )

        if deferred:
            lines.append(f"")
            lines.append(
                f"💡 Recommendation: Consider accelerating receivables or securing "
                f"short-term credit to cover the ${sum(d.amount for d in deferred):,.2f} "
                f"in deferred payments."
            )

        return "\n".join(lines)
