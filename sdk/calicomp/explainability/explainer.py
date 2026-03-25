"""
CaliComp Decision Explainer — Rule-Based Explainability Layer.

Generates human-readable explanations for each obligation's prioritization
score. Uses ONLY deterministic rule-based logic — zero AI/LLM.
"""

from __future__ import annotations


class DecisionExplainer:
    """
    Deterministic explainability engine for payment prioritization decisions.

    Takes the scoring matrix produced by PaymentPrioritizer and generates
    a plain-English explanation for every obligation.
    """

    # ── Thresholds for language generation ────────────────────────────────────

    URGENCY_HIGH = 0.2       # due_days ≤ 5
    URGENCY_MEDIUM = 0.05    # due_days ≤ 20
    PENALTY_HIGH = 0.7
    PENALTY_MEDIUM = 0.3

    def explain(self, scoring_matrix: list[dict]) -> list[str]:
        """
        Generate human-readable explanations from a scoring matrix.

        Args:
            scoring_matrix: List of dicts, each with:
                - "id"              (int)
                - "urgency"         (float)
                - "penalty"         (float)
                - "flexibility"     (int):    0 = non-deferrable, 1 = deferrable
                - "composite_score" (float)

        Returns:
            List of explanation strings, one per obligation, in the same order
            as the input scoring_matrix.
        """
        if not scoring_matrix:
            return []

        explanations: list[str] = []

        for entry in scoring_matrix:
            ob_id = entry["id"]
            urgency = float(entry["urgency"])
            penalty = float(entry["penalty"])
            flexibility = float(entry["flexibility"])
            composite = float(entry["composite_score"])

            explanation = self._build_single_explanation(
                ob_id=ob_id,
                urgency=urgency,
                penalty=penalty,
                flexibility=flexibility,
                composite=composite,
            )
            explanations.append(explanation)

        return explanations

    def _build_single_explanation(
        self,
        ob_id: int,
        urgency: float,
        penalty: float,
        flexibility: float,
        composite: float,
    ) -> str:
        """Build a single human-readable explanation for one obligation."""
        parts: list[str] = []

        # ── Urgency descriptor ────────────────────────────────────────────────

        if urgency >= self.URGENCY_HIGH:
            due_days_approx = round(1.0 / urgency)
            parts.append(f"it is due in {due_days_approx} day{'s' if due_days_approx != 1 else ''}")
        elif urgency >= self.URGENCY_MEDIUM:
            due_days_approx = round(1.0 / urgency)
            parts.append(f"it is due in {due_days_approx} days (moderate urgency)")
        else:
            due_days_approx = round(1.0 / urgency) if urgency > 0 else 0
            parts.append(f"it is due in {due_days_approx} days (low urgency)")

        # ── Penalty descriptor ────────────────────────────────────────────────

        if penalty >= self.PENALTY_HIGH:
            parts.append("has high penalty")
        elif penalty >= self.PENALTY_MEDIUM:
            parts.append("has moderate penalty")
        else:
            parts.append("has low penalty")

        # ── Flexibility descriptor ────────────────────────────────────────────

        if flexibility >= 1:
            parts.append("high flexibility (can be deferred)")
        else:
            parts.append("low flexibility (must be paid)")

        # ── Assemble sentence ─────────────────────────────────────────────────

        reason_clause = ", ".join(parts[:-1]) + f", and {parts[-1]}" if len(parts) > 1 else parts[0]
        score_note = f" (score: {composite:.4f})"

        return f"Obligation {ob_id} prioritized because {reason_clause}.{score_note}"
