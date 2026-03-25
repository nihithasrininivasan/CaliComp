"""
CaliComp SDK — Semi-Autonomous Fintech Cash Flow Intelligence Engine.

A pip-installable Python package providing:
  - Financial data ingestion (CSV/PDF)
  - Transaction normalization and deduplication
  - Liquidity runway computation (days-to-zero)
  - Deterministic LP-based payment prioritization
  - Full explainability for every decision
"""

__version__ = "0.1.0"

from calicomp.interfaces.engine import CaliCompEngine

__all__ = ["CaliCompEngine", "__version__"]
