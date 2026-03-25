"""
CaliComp API Routes.

Exposes REST endpoints:
  POST /api/upload      — Upload CSV bank statement
  POST /api/runway      — Compute liquidity runway
  POST /api/prioritize  — Prioritize payments via LP solver
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
    description: str
    amount: float
    type: Optional[str] = "outflow"


class RunwayRequest(BaseModel):
    """Request body for /runway endpoint."""

    transactions: list[TransactionPayload]
    current_balance: float = Field(..., gt=0, description="Current account balance")
    lookback_days: int = Field(30, ge=1, le=365, description="Historical lookback window")


class PrioritizeRequest(BaseModel):
    """Request body for /prioritize endpoint."""

    transactions: list[TransactionPayload]
    available_balance: float = Field(..., gt=0, description="Budget for payments")


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

    Accepts a list of transactions and current balance, returns
    detailed runway analysis with explainability.
    """
    try:
        result = _engine_service.compute_runway(
            transactions=[t.model_dump() for t in request.transactions],
            current_balance=request.current_balance,
            lookback_days=request.lookback_days,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Runway computation error: {str(e)}")


@router.post("/prioritize")
async def prioritize_payments(request: PrioritizeRequest):
    """
    Prioritize payments using the LP solver.

    Accepts a list of transactions and available balance, returns
    ranked items with full explainability.
    """
    try:
        result = _engine_service.prioritize(
            transactions=[t.model_dump() for t in request.transactions],
            available_balance=request.available_balance,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prioritization error: {str(e)}")
