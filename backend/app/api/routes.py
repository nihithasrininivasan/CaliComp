"""
CaliComp API Routes.

Exposes REST endpoints:
  POST /api/upload      — Upload CSV bank statement
  POST /api/runway      — Compute liquidity runway (days-to-zero)
  POST /api/prioritize  — Prioritize obligations via LP solver
"""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.engine_service import EngineService

router = APIRouter(tags=["cashflow"])

# Singleton service instance
_engine_service = EngineService()


# ── Request / Response Models ──────────────────────────────────────────────────


class TransactionPayload(BaseModel):
    """A single transaction in API request format."""

    date: str
    description: str = ""
    amount: float
    type: Optional[str] = "debit"


class RunwayRequest(BaseModel):
    """Request body for /runway endpoint."""

    transactions: list[TransactionPayload]


class ObligationPayload(BaseModel):
    """A single obligation in API request format."""

    id: int
    amount: float
    due_days: int = Field(..., ge=1, description="Days until due")
    penalty: float = Field(..., ge=0.0, description="Penalty weight for non-payment")
    flexible: int = Field(..., ge=0, le=1, description="0 = rigid, 1 = flexible")

    blocks_revenue: int = 0
    credit_impact: int = 0
    grace_days: int = 0
    penalty_growth: float = 0.0


class PrioritizeRequest(BaseModel):
    """Request body for /prioritize endpoint."""

    obligations: list[ObligationPayload]
    available_cash: float = Field(..., gt=0, description="Budget for payments")


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...)):
    """
    Upload a CSV bank statement.

    Returns parsed and normalized transactions.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported. Please upload a .csv file.",
        )

    try:
        # Save uploaded file to temp location
        content = await file.read()
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=".csv", mode="wb"
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Process through engine
        result = _engine_service.ingest_and_normalize(tmp_path)

        # Clean up temp file
        Path(tmp_path).unlink(missing_ok=True)

        return {
            "transaction_count": len(result),
            "transactions": result,
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/runway")
async def compute_runway(request: RunwayRequest):
    """
    Compute the liquidity runway (days-to-zero).

    Accepts a list of transactions, returns day-by-day balance simulation
    and the critical date when balance first goes negative.
    """
    try:
        txn_dicts = [t.model_dump() for t in request.transactions]
        result = _engine_service.get_runway(txn_dicts)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Runway computation error: {str(e)}")


@router.post("/prioritize")
async def prioritize_payments(request: PrioritizeRequest):
    """
    Prioritize obligations using the LP solver.

    Accepts obligations with urgency/penalty/flexibility scoring,
    returns selected payments, priority order, scoring matrix,
    and human-readable explanations.
    """
    try:
        data = {
            "obligations": [ob.model_dump() for ob in request.obligations],
            "available_cash": request.available_cash,
        }
        result = _engine_service.get_priorities(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prioritization error: {str(e)}")
