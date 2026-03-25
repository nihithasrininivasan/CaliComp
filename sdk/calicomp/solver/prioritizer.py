"""
CaliComp Payment Prioritizer — Deterministic LP Solver.

Uses PuLP to solve a 0-1 knapsack-style optimization problem:
  Maximize weighted priority score of selected obligations
  Subject to: total selected ≤ available_cash

Each obligation is scored on:
  - Urgency (inverse of due_days)
  - Penalty weight
  - Flexibility (reduces priority)

Fully deterministic — no AI/LLM.
"""

from __future__ import annotations

import pulp

# Weight applied to flexibility when computing priority score.
# A flexible obligation (flexible=1) has its score reduced by this amount.
FLEXIBILITY_WEIGHT = 0.5


class PaymentPrioritizer:
    """
    Deterministic LP-based payment prioritizer.

    Approach:
      1. Compute a composite priority score per obligation.
      2. Formulate a 0-1 binary knapsack LP: maximize total score.
      3. Constraint: sum of selected amounts ≤ available_cash.
      4. Solve with PuLP CBC (deterministic).
      5. Return selected IDs, priority order, and full scoring matrix.
    """

    def solve(self, obligations: list[dict], available_cash: float) -> dict:
        """
        Solve the payment prioritization problem.

        Args:
            obligations: List of dicts, each with:
                - "id"        (int):   unique obligation identifier
                - "amount"    (float): payment amount
                - "due_days"  (int):   days until due (lower = more urgent)
                - "penalty"   (float): penalty for non-payment (0.0–1.0 typical)
                - "flexible"  (int):   0 = rigid obligation, 1 = flexible/deferrable

            available_cash: Maximum budget for selected payments.

        Returns:
            dict with:
                - "selected_payments" (list[int]):    IDs chosen by the solver
                - "priority_order"    (list[int]):    all IDs sorted by score desc
                - "scoring_matrix"    (list[dict]):   per-obligation scoring breakdown
        """
        if not obligations:
            return {
                "selected_payments": [],
                "priority_order": [],
                "scoring_matrix": [],
            }

        # ── Step 1: Compute scoring matrix ────────────────────────────────────

        scoring_matrix: list[dict] = []
        scores: dict[int, float] = {}

        for ob in obligations:
            ob_id = int(ob["id"])
            due_days = max(int(ob["due_days"]), 1)  # prevent division by zero
            penalty = float(ob["penalty"])
            flexible = int(ob["flexible"])

            urgency = 1.0 / due_days
            flexibility_penalty = flexible * FLEXIBILITY_WEIGHT
            composite_score = round(urgency + penalty - flexibility_penalty, 6)

            scores[ob_id] = composite_score
            scoring_matrix.append({
                "id": ob_id,
                "urgency": round(urgency, 6),
                "penalty": penalty,
                "flexibility": flexible,
                "composite_score": composite_score,
            })

        # ── Step 2: Formulate LP ──────────────────────────────────────────────

        prob = pulp.LpProblem("ObligationPrioritization", pulp.LpMaximize)

        # Binary decision variables: pay (1) or skip (0)
        pay_vars: dict[int, pulp.LpVariable] = {}
        for ob in obligations:
            ob_id = int(ob["id"])
            pay_vars[ob_id] = pulp.LpVariable(
                f"pay_{ob_id}", cat=pulp.LpBinary
            )

        # Objective: maximize total weighted score
        prob += (
            pulp.lpSum(
                scores[int(ob["id"])] * pay_vars[int(ob["id"])]
                for ob in obligations
            ),
            "TotalPriorityScore",
        )

        # Constraint: total selected amount ≤ available cash
        prob += (
            pulp.lpSum(
                float(ob["amount"]) * pay_vars[int(ob["id"])]
                for ob in obligations
            )
            <= available_cash,
            "BudgetConstraint",
        )

        # ── Step 3: Solve ─────────────────────────────────────────────────────

        solver = pulp.PULP_CBC_CMD(msg=0)  # suppress solver output
        prob.solve(solver)

        # ── Step 4: Extract results ───────────────────────────────────────────

        selected_payments: list[int] = []
        for ob in obligations:
            ob_id = int(ob["id"])
            if pulp.value(pay_vars[ob_id]) == 1.0:
                selected_payments.append(ob_id)

        # Priority order: all IDs sorted by composite score descending
        priority_order = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)

        # Sort scoring matrix by composite score descending for readability
        scoring_matrix.sort(key=lambda x: x["composite_score"], reverse=True)

        return {
            "selected_payments": selected_payments,
            "priority_order": priority_order,
            "scoring_matrix": scoring_matrix,
        }
