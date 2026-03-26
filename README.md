🚀 CaliComp — AI-Powered Cashflow Intelligence & Decision Engine

Transforming raw financial signals into optimized, explainable decisions under uncertainty.

🧠 Overview

CaliComp is a full-stack financial intelligence system designed to help individuals and businesses make optimal financial decisions under cash constraints.

Unlike traditional tools that only track or visualize data, CaliComp:

ingests real financial data (Gmail, receipts, invoices)
models future liquidity scenarios
solves constrained optimization problems
produces actionable, explainable decisions

💡 CaliComp does not just show financial data — it actively recommends what to do next.

🔥 Key Differentiators

Most solutions:

rely on static or mock data
use simple heuristics
lack explainability
provide insights without actions
✅ CaliComp delivers:
Real-time Gmail ingestion via OAuth
Robust multi-format parsing (HTML + text emails)
Optimization-driven decision engine (PuLP)
Scenario-based financial simulation
Hybrid ML + deterministic modeling
Explainable outputs with confidence scoring
Automated action layer (email generation)
⚙️ System Architecture
External Data Sources (Gmail / PDFs / Receipts)
                ↓
        Data Ingestion Layer
                ↓
     Parsing & Structuring Engine
                ↓
   Forecasting Layer (ML + Features)
                ↓
      Liquidity Runway Simulation
                ↓
 Optimization Engine (Linear Programming)
                ↓
 Decision + Confidence Layer
                ↓
 Explainability + Action Generation
                ↓
        Frontend Visualization
🧩 Core Components
📬 1. Gmail Data Ingestion (OAuth-secured)
Google OAuth 2.0 authentication
Secure inbox access
Handles:
text/plain
text/html (HTML stripping)
Extracts:
₹ / Rs / INR formats
debit/credit classification
transaction dates

⚠️ Production-grade ingestion — not mock data

📊 2. Cash Runway Engine

Simulates future liquidity:

daily balance projection
critical cash-out detection
time-to-zero estimation
{
  "days_to_zero": 2,
  "critical_date": "2026-03-27",
  "daily_balances": [...]
}
🧠 3. Optimization-Based Prioritization Engine

Formulated as a constrained optimization problem:

Maximize financial stability under limited cash

Built using PuLP (Linear Programming).

Factors considered:
urgency
penalty
flexibility
liquidity impact
revenue blocking
credit impact
grace period
penalty growth
🎯 4. Decision Output Layer
selected payments
deferred payments
priority ranking
scoring matrix
📊 5. Confidence Scoring System
normalized (0–1)
based on score gaps
Level	Meaning
High	strong decision
Medium	moderate
Low	uncertain
🧾 6. Explainability Engine

Example:

“Selected due to high penalty, low flexibility, and near-term due date.”

human-readable
deterministic
auditable
✉️ 7. AI Email Action Generator

Generates context-aware emails:

vendor → polite
bank → formal
employee → transparent
📈 8. Scenario-Based Planning

Simulates multiple futures:

normal
high-revenue (festival spike)
worst-case
🤖 9. Lightweight ML Forecasting

Features:

day of week
holiday
season
past revenue

Models:

linear regression
moving average
🧪 10. Edge Case Handling

Handles:

empty inputs
zero cash
negative balances
missing fields
parsing failures
🖥️ Frontend (Visualization Layer)

🌐 Live Demo:
https://benevolent-salamander-233e89.netlify.app/

Key UI Components:
📉 Cash flow runway graph
🧠 Smart payment recommendations
📊 Scenario simulation
📩 Email action interface
🛠️ Tech Stack
Backend:
FastAPI
Python
PuLP (Linear Programming)
Gmail API (OAuth 2.0)
Data Processing:
Regex parsing
MIME decoding
HTML cleaning
ML Layer:
Linear regression
Feature engineering
Frontend:
React
Tailwind CSS
Recharts / D3
🔌 API Endpoints
Endpoint	Description
/api/email-ingest	Fetch & parse Gmail transactions
/api/runway	Simulate liquidity
/api/prioritize	Optimize payments
🧠 Design Philosophy
1. Decision > Visualization

Actionable intelligence over passive dashboards

2. Explainability > Black Box

Transparent and interpretable outputs

3. Real Data > Mock Data

Built to work on actual inputs

🏆 Impact
Helps startups manage burn rate
Enables smarter financial prioritization
Prevents liquidity crises
🧠 Final Thought

Most financial tools describe the past.
CaliComp prescribes the future.

👥 Team

Built with:

systems thinking
optimization
applied ML
and a lot of debugging
🚀 Status
✅ Real data ingestion
✅ Optimization engine
✅ ML integration
✅ Explainable outputs
✅ End-to-end pipeline
