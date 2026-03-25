"""
CaliComp Forecast Model — Lightweight ML-based cash inflow estimator.

Trains a simple Linear Regression on historical revenue data and predicts
future cash inflow based on contextual features. Falls back to a mean
average when history is insufficient.
"""

from __future__ import annotations

from statistics import mean

try:
    from sklearn.linear_model import LinearRegression
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False


def predict_cash_inflow(history: list[dict], context: dict) -> float:
    if not history:
        return 0.0

    if len(history) < 3 or not _SKLEARN_AVAILABLE:
        revenues = [d.get("revenue", 0.0) for d in history]
        prediction = float(mean(revenues)) if revenues else 0.0
    else:
        X = [
            [
                d.get("day_of_week", 0),
                d.get("is_holiday", 0),
                d.get("season", 0),
                d.get("is_festival", 0)
            ]
            for d in history
        ]
        y = [d.get("revenue", 0.0) for d in history]

        model = LinearRegression()
        model.fit(X, y)

        prediction = float(model.predict([[
            context.get("day_of_week", 0),
            context.get("is_holiday", 0),
            context.get("season", 0),
            context.get("is_festival", 0)
        ]])[0])

    if context.get("is_festival", 0) == 1:
        prediction *= 1.5
    elif context.get("is_holiday", 0) == 1:
        prediction *= 0.8
    else:
        prediction *= 1.1

    prediction = max(prediction, 0.0)
    return round(prediction, 2)
