# CaliComp Architecture

## System Overview

CaliComp is a **semi-autonomous fintech cash flow intelligence engine** built as a monorepo with three layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    React Dashboard                            │  │
│  │  • Upload CSV bank statements                                 │  │
│  │  • Visualize liquidity runway                                 │  │
│  │  • View payment prioritization                                │  │
│  │  • Responsive, premium dark UI                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │ HTTP (Axios)                         │
├──────────────────────────────┼──────────────────────────────────────┤
│                        SERVICE LAYER                                │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Backend                             │  │
│  │                                                               │  │
│  │  POST /api/upload      → Ingest CSV, normalize, return data   │  │
│  │  POST /api/runway      → Compute days-to-zero                 │  │
│  │  POST /api/prioritize  → LP solver for payment ranking        │  │
│  │  GET  /health          → Service health check                 │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Engine Service (Bridge)                     │  │  │
│  │  │  • Converts API payloads → SDK calls                    │  │  │
│  │  │  • Serializes SDK results → JSON responses              │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │ Python import                        │
├──────────────────────────────┼──────────────────────────────────────┤
│                        CORE LOGIC LAYER                             │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                 CaliComp Python SDK                            │  │
│  │                 (pip install -e ./sdk)                         │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │  Ingestion   │  │  Liquidity   │  │    LP Solver        │  │  │
│  │  │  Engine      │  │  Runway      │  │    (PuLP)           │  │  │
│  │  │              │  │  Calculator  │  │                     │  │  │
│  │  │ • CSV parse  │  │ • Burn rate  │  │ • 0-1 knapsack      │  │  │
│  │  │ • Normalize  │  │ • Days-to-0  │  │ • Category weights  │  │  │
│  │  │ • Dedup      │  │ • Explain    │  │ • Budget constraint │  │  │
│  │  │ • Categorize │  │              │  │ • Explainability    │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │ SQLAlchemy (future)                   │
├──────────────────────────────┼──────────────────────────────────────┤
│                        DATA LAYER                                   │
│                              ▼                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL                                  │  │
│  │  • Transaction storage                                        │  │
│  │  • Historical analysis data                                   │  │
│  │  • Audit trails                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. SDK Independence
The CaliComp SDK has **zero** web framework dependencies. It depends only on:
- `pandas` — data manipulation
- `pulp` — LP solver
- `python-dateutil` — date parsing

This ensures the core logic can be used in:
- CLI tools
- Jupyter notebooks
- Other web frameworks
- Scheduled batch jobs
- Lambda functions

### 2. Deterministic vs AI Separation
All **deterministic** logic (normalization, deduplication, runway calculation, LP solving) lives in the SDK. **AI-driven** features (email generation, anomaly detection) are intentionally kept as separate, optional modules.

### 3. Explainability First
Every computation produces a **human-readable explanation**:
- Runway analysis includes severity-coded messages (🔴🟡🟢)
- Payment prioritization explains why each item was selected or deferred
- Category weights are explicit and auditable

## Data Flow

```
CSV File ──▶ Ingestion ──▶ Normalization ──▶ Deduplication
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                                  ▼
                      Runway Calculator               Payment Prioritizer
                              │                                  │
                              ▼                                  ▼
                      RunwayResult                    PrioritizationResult
                  (days_to_zero,                    (ranked_items,
                   daily_burn_rate,                  total_selected,
                   explanation)                      explanation)
```

### Ingestion
1. Read CSV with `csv.DictReader`
2. Normalize column headers to lowercase
3. Validate required columns: `date`, `description`, `amount`

### Normalization
1. Parse dates (supports 8+ formats)
2. Parse amounts (handles `$`, `,`, negative values)
3. Detect direction (explicit column or sign-based)
4. Categorize via keyword matching (10 categories)
5. Generate deterministic SHA-256 IDs for dedup

### Runway Calculation
1. Filter transactions within lookback window
2. Compute average daily inflows and outflows
3. Derive net daily burn rate
4. Calculate: `days_to_zero = current_balance / net_daily_burn`
5. Generate severity-coded explanation

### Payment Prioritization
1. Filter outflow transactions
2. Assign category-based priority weights (1–10 scale)
3. Formulate 0-1 knapsack LP problem
4. Solve with CBC solver (deterministic)
5. Rank results: selected first, then by score

## Category Priority Weights

| Category | Weight | Rationale |
|----------|--------|-----------|
| Payroll | 10.0 | Legal obligation |
| Tax | 9.0 | Government penalties |
| Rent | 8.0 | Critical operations |
| Utilities | 7.0 | Essential services |
| Insurance | 6.5 | Hard to reinstate |
| Software | 5.0 | Operational dependency |
| Supplies | 4.0 | Can be deferred |
| Marketing | 3.0 | Discretionary |
| Travel | 2.0 | Highly deferrable |
| General | 1.0 | Uncategorized |

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| SDK | Python 3.10+, PuLP, pandas | Core deterministic logic |
| Backend | FastAPI, Uvicorn, Pydantic | REST API layer |
| Frontend | React 18, Axios | Dashboard UI |
| Database | PostgreSQL 16 | Persistent storage |
| Containers | Docker, Docker Compose | Deployment |

## Security Considerations

- Environment secrets are never committed (`.env` in `.gitignore`)
- CORS is configurable via environment variables
- File uploads are validated (CSV-only) and processed in temp storage
- No hardcoded credentials in any module
- SDK has minimal dependency surface area
