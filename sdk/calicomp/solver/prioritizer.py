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
                - "status"            (str):          solver execution status
                - "message"           (str, optional): status details for errors
        """
        # ── Edge Case 1: Empty obligations ────────────────────────────────────
        if not obligations:
            return {
                "selected_payments": [],
                "priority_order": [],
                "scoring_matrix": [],
                "status": "no_obligations",
                "confidence_score": 0.0,
                "confidence_level": "low"
            }

        # ── Edge Case 2: Zero or negative available cash ──────────────────────
        if available_cash <= 0:
            return {
                "selected_payments": [],
                "priority_order": [int(ob["id"]) for ob in obligations],
                "scoring_matrix": [],
                "status": "no_cash",
                "message": "No available cash to allocate",
                "confidence_score": 0.0,
                "confidence_level": "low"
            }

        # ── Edge Case 3: Invalid obligations (negative or zero amounts) ───────
        valid_obligations = []
        for ob in obligations:
            if float(ob.get("amount", 0)) > 0:
                valid_obligations.append(ob)

        if not valid_obligations:
            return {
                "selected_payments": [],
                "priority_order": [],
                "scoring_matrix": [],
                "status": "invalid_input",
                "message": "No valid obligations",
                "confidence_score": 0.0,
                "confidence_level": "low"
            }

        # ── Step 1: Compute scoring matrix ────────────────────────────────────

        scoring_matrix: list[dict] = []
        scores: dict[int, float] = {}

        for ob in valid_obligations:
            print("DEBUG obligation:", ob)
            ob_id = int(ob["id"])
            
            # ── Edge Case 4: Prevent division by zero ─────────────────────────
            due_days = max(int(ob.get("due_days", 1)), 1)
            
            # ── Edge Case 5: Sanitize input values ────────────────────────────
            penalty = max(float(ob.get("penalty", 0.0)), 0.0)
            flexible = 1 if int(ob.get("flexible", 0)) else 0

            urgency = 1.0 / due_days
            
            # ── New financial parameters ──────────────────────────────────────
            liquidity_impact = float(ob.get("amount", 0)) / max(available_cash, 1.0)
            blocks_revenue = int(ob.get("blocks_revenue", 0))
            credit_impact = int(ob.get("credit_impact", 0))
            grace_days = int(ob.get("grace_days", 0))
            penalty_growth = float(ob.get("penalty_growth", 0))

            grace_factor = 1.0 / (grace_days + 1)

            composite_score = (
                penalty * 1.0 +
                urgency * 50 +
                penalty_growth * 80 +
                blocks_revenue * 120 +
                credit_impact * 150 +
                grace_factor * 60 -
                liquidity_impact * 100
            )

            scores[ob_id] = composite_score
            scoring_matrix.append({
                "id": ob_id,
                "urgency": round(urgency, 6),
                "penalty": penalty,
                "flexibility": flexible,
                "liquidity_impact": liquidity_impact,
                "blocks_revenue": blocks_revenue,
                "credit_impact": credit_impact,
                "grace_days": grace_days,
                "penalty_growth": penalty_growth,
                "composite_score": composite_score,
            })

        # ── Step 2: Formulate LP ──────────────────────────────────────────────

        prob = pulp.LpProblem("ObligationPrioritization", pulp.LpMaximize)

        # Binary decision variables: pay (1) or skip (0)
        pay_vars: dict[int, pulp.LpVariable] = {}
        for ob in valid_obligations:
            ob_id = int(ob["id"])
            pay_vars[ob_id] = pulp.LpVariable(
                f"pay_{ob_id}", cat=pulp.LpBinary
            )

        # Objective: maximize total weighted score
        prob += (
            pulp.lpSum(
                scores[int(ob["id"])] * pay_vars[int(ob["id"])]
                for ob in valid_obligations
            ),
            "TotalPriorityScore",
        )

        # Constraint: total selected amount ≤ available cash
        prob += (
            pulp.lpSum(
                float(ob["amount"]) * pay_vars[int(ob["id"])]
                for ob in valid_obligations
            )
            <= available_cash,
            "BudgetConstraint",
        )

        # ── Step 3: Solve ─────────────────────────────────────────────────────

        solver = pulp.PULP_CBC_CMD(msg=0)  # suppress solver output
        prob.solve(solver)

        # ── Step 4: Extract results ───────────────────────────────────────────

        selected_payments: list[int] = []
        for ob in valid_obligations:
            ob_id = int(ob["id"])
            if pulp.value(pay_vars[ob_id]) == 1.0:
                selected_payments.append(ob_id)

        # Priority order: all IDs sorted by composite score descending
        priority_order = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)

        # ── Step 5: Compute Confidence Metric ─────────────────────────────────
        confidence_score = 0.0
        confidence_level = "low"

        # Sort temporarily by pure score just to compute score gap
        scoring_matrix.sort(key=lambda x: x["composite_score"], reverse=True)

        if len(scoring_matrix) > 0:
            top_score = float(scoring_matrix[0]["composite_score"])
            if len(scoring_matrix) >= 2:
                second_top_score = float(scoring_matrix[1]["composite_score"])
                score_gap = top_score - second_top_score
            else:
                score_gap = top_score

            # Normalize into [0, 1] bounded value
            calculated_confidence = score_gap / (top_score + 1e-6)
            confidence_score = round(max(0.0, min(1.0, calculated_confidence)), 2)

            # Assign taxonomy
            if confidence_score >= 0.75:
                confidence_level = "high"
            elif confidence_score >= 0.4:
                confidence_level = "medium"
            else:
                confidence_level = "low"

        # Attach decisions, confidence, and reorder matrix properly
        for entry in scoring_matrix:
            entry["decision"] = "selected" if entry["id"] in selected_payments else "deferred"
            entry["decision_confidence"] = confidence_level

        # Re-sort: Selected items FIRST, then strictly by highest score descending
        scoring_matrix.sort(key=lambda x: (x["decision"] != "selected", -x["composite_score"]))

        # ── Edge Case 6: Ensure stable output structure ───────────────────────
        return {
            "selected_payments": selected_payments,
            "priority_order": priority_order,
            "scoring_matrix": scoring_matrix,
            "status": "success",
            "confidence_score": confidence_score,
            "confidence_level": confidence_level
        }
