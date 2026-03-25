<p align="center">
  <h1 align="center">💰 CaliComp</h1>
  <p align="center"><strong>Semi-Autonomous Fintech Cash Flow Intelligence Engine</strong></p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#quickstart">Quickstart</a> •
    <a href="#sdk">SDK</a> •
    <a href="#api-reference">API</a> •
    <a href="#license">License</a>
  </p>
</p>

---

## Overview

**CaliComp** is a production-grade cash flow intelligence engine designed for SMBs and fintech platforms. It ingests bank statements (CSV/PDF), invoices, and receipts via OCR, normalizes financial data, deduplicates and reconciles transactions, computes liquidity runway (days-to-zero), and uses a deterministic LP solver to prioritize payments — all with full explainability.

Built as a **monorepo** with a reusable Python SDK, FastAPI backend, and React dashboard.

---

## Features

| Capability | Description |
|---|---|
| 📄 **Ingestion** | CSV/PDF bank statements, invoices, receipts (OCR-ready) |
| 🔄 **Normalization** | Standardize dates, amounts, categories across sources |
| 🧹 **Deduplication** | Fuzzy-match and reconcile duplicate transactions |
| 📉 **Liquidity Runway** | Compute days-to-zero based on burn rate and inflows |
| 🧮 **LP Solver** | Deterministic PuLP-based payment prioritization |
| 🔍 **Explainability** | Human-readable reasoning for every decision |
| 📧 **AI Actions** | Generate payment reminder emails and summaries |
| 📊 **Dashboard** | React frontend with real-time financial insights |

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React UI   │────▶│  FastAPI BE  │────▶│  PostgreSQL  │
│  (Dashboard) │     │   (REST)     │     │   (Storage)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  CaliComp    │
                    │  Python SDK  │
                    │  (Core Logic)│
                    └──────────────┘
```

- **SDK** (`sdk/`): Pip-installable Python package — ingestion, normalization, liquidity, solver
- **Backend** (`backend/`): FastAPI REST API consuming the SDK
- **Frontend** (`frontend/`): React dashboard for visualization
- **Shared** (`shared/`): Cross-language type definitions

> 📐 **Design Principle**: The SDK contains **zero** web framework dependencies. All deterministic logic is separated from AI/ML layers.

---

## Quickstart

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (or use Docker)
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/nihithasrininivasan/CaliComp.git
cd CaliComp
git checkout dev

# Run the setup script (Linux/macOS)
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Using Docker Compose

```bash
cp .env.example .env
docker-compose up --build
```

This starts:
- **Backend** → `http://localhost:8000`
- **Frontend** → `http://localhost:3000`
- **PostgreSQL** → `localhost:5432`

### 3. Manual Setup

```bash
# Install SDK
cd sdk && pip install -e . && cd ..

# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 4. Run Services

```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm start
```

---

## SDK

The CaliComp SDK is a standalone, pip-installable Python package.

### Installation

```bash
pip install -e ./sdk
```

### Usage

```python
from calicomp import CaliCompEngine

engine = CaliCompEngine()

# Ingest transactions from CSV
transactions = engine.ingest("data/sample/demo_transactions.csv")

# Normalize data
normalized = engine.normalize(transactions)

# Compute liquidity runway
runway = engine.compute_runway(
    transactions=normalized,
    current_balance=50000.00
)
print(f"Days to zero: {runway.days_to_zero}")
print(f"Daily burn rate: ${runway.daily_burn_rate:.2f}")

# Prioritize payments using LP solver
priority = engine.prioritize(
    transactions=normalized,
    available_balance=50000.00
)
for item in priority.ranked_items:
    print(f"  {item.description}: ${item.amount} (priority: {item.score})")
```

---

## API Reference

### `POST /api/upload`
Upload a CSV file of bank transactions.

**Request**: `multipart/form-data` with file field  
**Response**: `{ "transaction_count": int, "transactions": [...] }`

### `POST /api/runway`
Compute liquidity runway from transactions.

**Request Body**:
```json
{
  "transactions": [...],
  "current_balance": 50000.00
}
```
**Response**: `{ "days_to_zero": float, "daily_burn_rate": float, ... }`

### `POST /api/prioritize`
Prioritize payments using the LP solver.

**Request Body**:
```json
{
  "transactions": [...],
  "available_balance": 50000.00
}
```
**Response**: `{ "ranked_items": [...], "explanation": "..." }`

---

## Project Structure

```
CaliComp/
├── sdk/                        # Pip-installable Python SDK
│   ├── pyproject.toml
│   └── calicomp/
│       ├── __init__.py
│       ├── interfaces/engine.py
│       ├── liquidity/runway.py
│       └── solver/prioritizer.py
├── backend/                    # FastAPI backend
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── main.py
│       ├── api/routes.py
│       └── services/engine_service.py
├── frontend/                   # React dashboard
│   ├── package.json
│   ├── Dockerfile
│   ├── public/index.html
│   └── src/
│       ├── App.jsx
│       ├── index.js
│       └── services/api.js
├── shared/types/               # Cross-language types
│   └── transaction.ts
├── data/sample/                # Sample data
│   └── demo_transactions.csv
├── docs/                       # Documentation
│   └── architecture.md
├── scripts/                    # Automation scripts
│   └── setup.sh
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| SDK | Python 3.10+, PuLP, pandas |
| Backend | FastAPI, Uvicorn, SQLAlchemy |
| Frontend | React 18, Axios |
| Database | PostgreSQL 14+ |
| Containerization | Docker, Docker Compose |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ for the fintech community
</p>
