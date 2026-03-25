// @BACKEND-PROMPT:
// Read CLAUDE.md. Build POST /api/v1/ai/insights in backend/app/routers/ai_insights.py
// This endpoint receives the current FinancialState and calls GPT-4o to generate 3 insights.
// Input: {business_id} — fetch all required data from DB internally
// Build the context object: {cash_balance, runway_days, daily_burn, obligations: top 5 by priority_score, receivables: all PENDING, overdue_count, upcoming_7days_total}
// System prompt (use verbatim):
// "You are CaliComp's financial intelligence engine for Indian SMBs. You have the business's real financial data. Generate exactly 3 actionable insights as a JSON array. Each insight must: reference a specific vendor name or amount, cite a specific date or number of days, recommend one concrete action. Format: [{title, priority: HIGH|MEDIUM|LOW, body (max 30 words), impact (e.g. '+4 Days Runway' or 'Save ₹1,200'), action_label, action_route, category: DEFERRAL|COLLECTION|COMPLIANCE|CASHFLOW}]. Return JSON only."
// Cache the response: store in a insights_cache table with {business_id, insights_json, generated_at}. Serve cached version if < 30 minutes old to reduce API costs.
// Invalidate cache whenever a new transaction, obligation, or reconciliation match is added.

// @ML-PROMPT:
// Read CLAUDE.md. Build a cash flow anomaly detection module for CaliComp.
// This runs alongside the main AI insights to surface unusual patterns.
// Goal: detect when a transaction or obligation is statistically unusual compared to historical patterns.
// Implementation in backend/app/ml/anomaly_detector.py:
// 1. For each transaction category (Rent, Salary, Supplier, etc.): compute rolling 3-month mean and std of transaction amounts.
// 2. Flag any new transaction where |amount - mean| > 2 * std as anomalous.
// 3. For obligations: flag if a vendor's invoice amount has increased by more than 20% compared to their last 3 invoices.
// 4. Use Isolation Forest (sklearn.ensemble.IsolationForest) on the full transaction feature vector {amount, day_of_month, category_encoded, vendor_encoded} for a more robust anomaly score.
// 5. Anomalies are surfaced as a special HIGH priority AI insight: "Unusual ₹[amount] transaction detected for [vendor]. This is [X]% higher than their typical invoice. Review before paying."
// 6. Expose as: GET /api/v1/ml/anomalies — returns [{transaction_id, anomaly_score, reason, severity: HIGH|MEDIUM}]
// Retrain Isolation Forest weekly. Store model at backend/models/anomaly_model.pkl

import type { AIInsight } from '../types';

const MOCK_INSIGHTS: AIInsight[] = [
  {
    id: 'ins-1',
    title: 'Defer TechSupplies — Gain 4 Days',
    priority: 'HIGH',
    body: 'TechSupplies Co. has 70% flexibility. Deferring ₹45,000 by 7 days extends runway from 42 to 46 days.',
    impact: '+4 Days Runway',
    actionLabel: 'Generate Email',
    actionRoute: '/obligations',
    category: 'DEFERRAL',
  },
  {
    id: 'ins-2',
    title: 'GST Overdue — Pay Immediately',
    priority: 'HIGH',
    body: '₹62,000 GST deposit is 2 days overdue. Every day adds ₹30 in penalty at 18% p.a. Pay today to stop accrual.',
    impact: 'Save ₹210 Penalty',
    actionLabel: 'View Obligation',
    actionRoute: '/obligations',
    category: 'COMPLIANCE',
  },
  {
    id: 'ins-3',
    title: 'Follow Up: Mehta Exports ₹2.25L',
    priority: 'MEDIUM',
    body: 'Mehta Exports historically pays 5 days late. Sending a reminder now could bring ₹2,25,000 in 3 days, adding 8 runway days.',
    impact: '+8 Days Runway',
    actionLabel: 'Draft Reminder',
    actionRoute: '/assistant',
    category: 'COLLECTION',
  },
];

export async function generateInsights(): Promise<AIInsight[]> {
  // TODO: replace with POST /api/v1/ai/insights
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_INSIGHTS), 1500);
  });
}
