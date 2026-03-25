"""
CaliComp Backend — FastAPI Application Entry Point.

Starts the REST API server with CORS, health checks, and route registration.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router

# ── Application Factory ───────────────────────────────────────────────────────

app = FastAPI(
    title="CaliComp API",
    description="Semi-Autonomous Fintech Cash Flow Intelligence Engine",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Configuration ────────────────────────────────────────────────────────

cors_origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routes ───────────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api")


# ── Health Check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health_check():
    """Quick health check endpoint."""
    return {
        "status": "healthy",
        "service": "calicomp-backend",
        "version": "0.1.0",
    }


@app.get("/", tags=["system"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "CaliComp API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }
