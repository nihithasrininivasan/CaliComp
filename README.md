# CaliComp

**AI-Powered Cashflow Intelligence & Decision Engine**

CaliComp is a full-stack financial intelligence system that transforms raw financial signals into optimized, explainable decisions under uncertainty. It is built for individuals and businesses managing cash constraints — going beyond visualization to actively prescribe what to do next.

Live Demo: (https://caliicomp.netlify.app/login)

---

## What Makes CaliComp Different

Most financial tools describe the past. CaliComp prescribes the future.

| Typical Tools | CaliComp |
|---|---|
| Static or mock data | Real-time Gmail ingestion via OAuth |
| Simple rule-based heuristics | Constrained optimization with linear programming |
| Insights without actions | Actionable decisions with automated email generation |
| Black-box outputs | Explainable, auditable, confidence-scored results |

---

## System Architecture

```
External Data Sources (Gmail / PDFs / Receipts)
                |
        Data Ingestion Layer
                |
     Parsing & Structuring Engine
                |
   Forecasting Layer (ML + Features)
                |
      Liquidity Runway Simulation
                |
 Optimization Engine (Linear Programming)
                |
 Decision + Confidence Layer
                |
 Explainability + Action Generation
                |
        Frontend Visualization
```

---

## Core Components

### Gmail Data Ingestion
- Google OAuth 2.0 authentication for secure inbox access
- Handles `text/plain` and `text/html` (with HTML stripping)
- Extracts INR/Rs/₹ amounts, debit/credit classification, and transaction dates
- Production-grade ingestion — not mock data

### Cash Runway Engine
Simulates future liquidity by projecting daily balances, detecting critical cash-out points, and estimating time-to-zero.

```json
{
  "days_to_zero": 2,
  "critical_date": "2026-03-27",
  "daily_balances": [...]
}
```

### Optimization-Based Prioritization Engine
Formulated as a constrained linear programming problem using PuLP:

> **Maximize financial stability under limited cash**

Decision factors: urgency, penalty severity, flexibility, liquidity impact, revenue blocking, credit impact, grace period, and penalty growth rate.

### Decision Output Layer
Produces selected vs. deferred payment sets, priority rankings, and a full scoring matrix per obligation.

### Confidence Scoring System
Scores are normalized between 0 and 1 based on inter-option score gaps:

| Level | Meaning |
|---|---|
| High | Strong, clear decision |
| Medium | Moderate certainty |
| Low | Ambiguous — review recommended |

### Explainability Engine
Every decision surfaces a human-readable rationale, for example:

> *"Selected due to high penalty, low flexibility, and near-term due date."*

All outputs are deterministic and auditable.

### AI Email Action Generator
Context-aware vendor/bank/employee email drafts generated per decision:
- Vendor communications — polite tone
- Bank communications — formal tone
- Employee communications — transparent tone

### Scenario-Based Planning
Simulates multiple financial futures in parallel:
- Normal trajectory
- High-revenue (e.g. festival or seasonal spike)
- Worst-case

### ML Forecasting Layer
Lightweight models for revenue forecasting:

- **Features:** day of week, holiday flag, season, historical revenue
- **Models:** linear regression, moving average

### Edge Case Handling
Gracefully handles empty inputs, zero cash, negative balances, missing fields, and parsing failures throughout the pipeline.

---

## Tech Stack

**Backend**
- FastAPI, Python
- PuLP (Linear Programming)
- Gmail API (OAuth 2.0)
- Regex parsing, MIME decoding, HTML cleaning

**ML Layer**
- Linear regression
- Feature engineering

**Frontend**
- React, Tailwind CSS
- Recharts / D3

---

## API Reference

| Endpoint | Description |
|---|---|
| `POST /api/email-ingest` | Fetch and parse Gmail transactions |
| `POST /api/runway` | Simulate liquidity runway |
| `POST /api/prioritize` | Run optimization and return payment decisions |

---

## Status

- [x] Real data ingestion (Gmail OAuth)
- [x] Optimization engine (linear programming)
- [x] ML forecasting integration
- [x] Explainable decision outputs
- [x] End-to-end pipeline
- [x] Frontend visualization

---

## Design Philosophy

**Decision over visualization** — actionable intelligence, not passive dashboards.

**Explainability over black-box** — every output is transparent and interpretable.

**Real data over mocks** — built to operate on actual financial inputs from day one.

---

## Impact

- Helps startups monitor and manage burn rate in real time
- Enables smarter, data-driven payment prioritization
- Surfaces liquidity crises before they become critical
