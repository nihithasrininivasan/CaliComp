// @DATABASE-PROMPT:
// Read CLAUDE.md. Create the PostgreSQL database schema and seed data for CaliComp.
// Build the following tables exactly matching these TypeScript interfaces from the frontend mock:
// Transaction: {id, business_id, date, description, category, amount, type: CREDIT|DEBIT, status: PENDING|RECONCILED|FLAGGED|PARTIAL, source: MANUAL|OCR|BANK_FEED|CSV, recurring: boolean, frequency?: WEEKLY|MONTHLY|QUARTERLY, created_at}
// Obligation: {id, business_id, vendor_name, amount, due_date, category: RENT|SALARY|SUPPLIER|TAX|LOAN|UTILITY|OTHER, penalty_per_day, flexibility_score (0-100), relationship_score (0-10), status: PENDING|PAID|DEFERRED, priority_score (computed), source_doc_id}
// Receivable: {id, business_id, client_name, amount, expected_date, confidence: HIGH|MED|LOW, status: PENDING|RECEIVED|OVERDUE}
// Notification: {id, business_id, type: OVERDUE|UPCOMING|AI_INSIGHT|RECONCILIATION|SYSTEM, title, body, timestamp, read: boolean, action_label, action_route}
// ReconciliationMatch: {id, business_id, bank_debit_id, obligation_id, confidence_score, match_reason, status: POTENTIAL|CONFIRMED|IGNORED, created_at}
// AuditLog: {id, business_id, action, entity_type, entity_id, old_value_json, new_value_json, performed_by, timestamp}
// UserPlan: {user_id, plan: FREE|PRO, upgraded_at, payment_reference}
// Create Alembic migrations for all tables.
// Seed the Mehta Fabrics demo scenario from CLAUDE.md with at least 30 transactions spanning 90 days.
// Add indexes on: business_id (all tables), date DESC (transactions), due_date (obligations), timestamp DESC (notifications, audit_log).
// Expose a seed endpoint: POST /api/v1/demo/reset that clears and reseeds all tables for the demo business.

import { addDays, subDays, format } from 'date-fns';
import type { Transaction, Obligation, CashFlowPoint } from '../types';

const TODAY = new Date('2026-03-25');

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

// @BACKEND-PROMPT:
// Read CLAUDE.md. Build GET /api/v1/transactions in backend/app/routers/transactions.py
// Query params: business_id (from JWT), days: 30|60|90 (default 30), type: CREDIT|DEBIT|ALL, category, status, search (text search on description)
// Returns paginated response: {data: Transaction[], meta: {total, page, per_page, date_range}}
// Filter by: date >= today - days, optionally by type/category/status
// Text search: case-insensitive ILIKE on description and vendor fields
// Include a summary block: {total_credits, total_debits, net_cashflow, transaction_count}
// Also build: POST /api/v1/transactions (manual entry), PATCH /api/v1/transactions/{id}/status, DELETE /api/v1/transactions/{id}
// For recurring transactions: POST /api/v1/transactions/recurring creates a RecurringTemplate. A background APScheduler job runs daily at midnight and creates new Transaction records from active RecurringTemplates.

const RAW_TRANSACTIONS: Omit<Transaction, 'id' | 'date'>[] = [
  { description: 'Client Payment – Mehta Exports', amount: 225000, type: 'income', status: 'reconciled', category: 'Sales' },
  { description: 'Office Rent – March', amount: 45000, type: 'expense', status: 'reconciled', category: 'Rent', recurring: true, frequency: 'monthly' },
  { description: 'Employee Salaries', amount: 320000, type: 'expense', status: 'reconciled', category: 'Salary', recurring: true, frequency: 'monthly' },
  { description: 'GST Q4 Payment', amount: 62000, type: 'expense', status: 'flagged', category: 'Tax' },
  { description: 'AWS Cloud Services', amount: 12500, type: 'expense', status: 'pending', category: 'Infrastructure', recurring: true, frequency: 'monthly' },
  { description: 'Client Payment – Verma Textiles', amount: 180000, type: 'income', status: 'reconciled', category: 'Sales' },
  { description: 'Vendor Invoice – Sharma Textiles', amount: 55000, type: 'expense', status: 'reconciled', category: 'Supplier' },
  { description: 'TDS Payment – Feb', amount: 12000, type: 'expense', status: 'reconciled', category: 'Tax' },
  { description: 'HDFC Business Loan EMI', amount: 85000, type: 'expense', status: 'reconciled', category: 'Loan', recurring: true, frequency: 'monthly' },
  { description: 'Client Payment – Singh Industries', amount: 95000, type: 'income', status: 'reconciled', category: 'Consulting' },
  { description: 'Electricity Bill', amount: 8500, type: 'expense', status: 'reconciled', category: 'Utility', recurring: true, frequency: 'monthly' },
  { description: 'Internet & Telecom', amount: 3200, type: 'expense', status: 'reconciled', category: 'Infrastructure', recurring: true, frequency: 'monthly' },
  { description: 'Vendor Invoice – Kapoor Packaging', amount: 32000, type: 'expense', status: 'reconciled', category: 'Supplier' },
  { description: 'Client Payment – Rajan Fabrics', amount: 150000, type: 'income', status: 'reconciled', category: 'Sales' },
  { description: 'Office Supplies', amount: 4800, type: 'expense', status: 'reconciled', category: 'Infrastructure' },
  { description: 'TDS Payment – Jan', amount: 12000, type: 'expense', status: 'reconciled', category: 'Tax' },
  { description: 'Employee Salaries – Feb', amount: 320000, type: 'expense', status: 'reconciled', category: 'Salary' },
  { description: 'Vendor Invoice – TechSupplies Co.', amount: 45000, type: 'expense', status: 'pending', category: 'Supplier' },
  { description: 'Client Payment – Gupta & Sons', amount: 72000, type: 'income', status: 'reconciled', category: 'Sales' },
  { description: 'Office Rent – February', amount: 45000, type: 'expense', status: 'reconciled', category: 'Rent' },
  { description: 'HDFC Loan EMI – Feb', amount: 85000, type: 'expense', status: 'reconciled', category: 'Loan' },
  { description: 'GST Monthly Deposit – Feb', amount: 58000, type: 'expense', status: 'reconciled', category: 'Tax' },
  { description: 'Client Payment – Patel Exports', amount: 210000, type: 'income', status: 'reconciled', category: 'Sales' },
  { description: 'Consulting Fee – Agarwal Advisory', amount: 25000, type: 'expense', status: 'reconciled', category: 'Consulting' },
  { description: 'Vendor Invoice – Sharma Textiles', amount: 48000, type: 'expense', status: 'reconciled', category: 'Supplier' },
  { description: 'Employee Salaries – Jan', amount: 320000, type: 'expense', status: 'reconciled', category: 'Salary' },
  { description: 'Client Payment – Mehta Exports Q1', amount: 315000, type: 'income', status: 'reconciled', category: 'Sales' },
  { description: 'HDFC Loan EMI – Jan', amount: 85000, type: 'expense', status: 'reconciled', category: 'Loan' },
  { description: 'Office Rent – January', amount: 45000, type: 'expense', status: 'reconciled', category: 'Rent' },
  { description: 'Water & Maintenance Charges', amount: 5200, type: 'expense', status: 'reconciled', category: 'Utility' },
];

const DAY_OFFSETS = [
  0, 1, 3, 2, 4, 5, 7, 8, 6, 10, 11, 13, 14, 15, 16, 22, 23, 20, 25, 28,
  30, 32, 35, 38, 40, 45, 50, 55, 60, 62,
];

export function getMockTransactions(days: 30 | 60 | 90 = 30): Transaction[] {
  return RAW_TRANSACTIONS.slice(0, days === 30 ? 20 : days === 60 ? 25 : 30).map((t, i) => ({
    ...t,
    id: `tx-${i + 1}`,
    date: format(subDays(TODAY, DAY_OFFSETS[i] ?? i * 2), 'yyyy-MM-dd'),
    recurring: t.recurring ?? false,
  }));
}

// ─── OBLIGATIONS ─────────────────────────────────────────────────────────────

// @BACKEND-PROMPT:
// Read CLAUDE.md. Build GET /api/v1/obligations in backend/app/routers/obligations.py
// Returns all PENDING and DEFERRED obligations for the authenticated business, sorted by priority_score DESC.
// priority_score is a computed column: call scorer.score_obligation() from engine/scorer.py on each row at query time (or store as a materialized column updated on every pipeline run).
// Also build:
// PATCH /api/v1/obligations/{id} — update status (PAID/DEFERRED), due_date, notes
// POST /api/v1/obligations — create manual obligation
// POST /api/v1/obligations/{id}/defer — body: {new_due_date, reason}. Updates due_date, logs to AuditLog, triggers notification creation, re-runs pipeline.
// GET /api/v1/obligations/calendar — returns obligations grouped by month, formatted for a calendar view

// @DATABASE-PROMPT:
// Add a GST calendar computation function to the database layer.
// Based on the business's GSTIN and invoices table, compute:
// - Monthly GST liability = sum of output_gst on sales invoices - sum of input_gst on purchase invoices
// - Auto-create a TAX obligation record for the 20th of each following month
// - Flag if liability exceeds ₹1L (requires e-filing, not manual)
// - Similarly compute TDS obligations: for any vendor payment > ₹30,000 in a month, create a TDS obligation for the 7th of the following month

export const MOCK_OBLIGATIONS: Obligation[] = [
  {
    id: 'ob-1',
    dueDate: format(subDays(TODAY, 2), 'yyyy-MM-dd'),
    description: 'GST Monthly Deposit',
    vendorName: 'GST Portal',
    amount: 62000,
    status: 'overdue',
    type: 'gst',
    priority: 'high',
    flexibility: 0.1,
    penaltyRate: 0.18,
    penaltyPerDay: 30,
    relationshipTier: 'strategic',
    relationshipScore: 10,
    priorityScore: 9.8,
  },
  {
    id: 'ob-2',
    dueDate: format(addDays(TODAY, 2), 'yyyy-MM-dd'),
    description: 'TDS Payment – March',
    vendorName: 'Income Tax Dept',
    amount: 12000,
    status: 'unpaid',
    type: 'tds',
    priority: 'high',
    flexibility: 0.1,
    penaltyRate: 0.15,
    penaltyPerDay: 5,
    relationshipTier: 'strategic',
    relationshipScore: 10,
    priorityScore: 9.2,
  },
  {
    id: 'ob-3',
    dueDate: format(addDays(TODAY, 5), 'yyyy-MM-dd'),
    description: 'HDFC Business Loan EMI',
    vendorName: 'HDFC Bank',
    amount: 85000,
    status: 'unpaid',
    type: 'emi',
    priority: 'high',
    flexibility: 0.0,
    penaltyRate: 0.24,
    penaltyPerDay: 56,
    relationshipTier: 'strategic',
    relationshipScore: 9,
    priorityScore: 8.9,
  },
  {
    id: 'ob-4',
    dueDate: format(addDays(TODAY, 7), 'yyyy-MM-dd'),
    description: 'Office Rent – April',
    vendorName: 'Sharma Properties',
    amount: 45000,
    status: 'unpaid',
    type: 'vendor',
    priority: 'high',
    flexibility: 0.3,
    penaltyRate: 0.05,
    penaltyPerDay: 6,
    relationshipTier: 'strategic',
    relationshipScore: 8,
    priorityScore: 7.5,
  },
  {
    id: 'ob-5',
    dueDate: format(addDays(TODAY, 10), 'yyyy-MM-dd'),
    description: 'Vendor Invoice – TechSupplies Co.',
    vendorName: 'TechSupplies Co.',
    amount: 45000,
    status: 'unpaid',
    type: 'vendor',
    priority: 'medium',
    flexibility: 0.7,
    penaltyRate: 0.02,
    penaltyPerDay: 2,
    relationshipTier: 'regular',
    relationshipScore: 6,
    priorityScore: 5.2,
  },
  {
    id: 'ob-6',
    dueDate: format(addDays(TODAY, 14), 'yyyy-MM-dd'),
    description: 'Vendor Invoice – Sharma Textiles',
    vendorName: 'Sharma Textiles',
    amount: 55000,
    status: 'unpaid',
    type: 'vendor',
    priority: 'medium',
    flexibility: 0.5,
    penaltyRate: 0.03,
    penaltyPerDay: 4,
    relationshipTier: 'regular',
    relationshipScore: 7,
    priorityScore: 5.8,
  },
  {
    id: 'ob-7',
    dueDate: format(addDays(TODAY, 20), 'yyyy-MM-dd'),
    description: 'Electricity Bill – March',
    vendorName: 'MSEDCL',
    amount: 8500,
    status: 'unpaid',
    type: 'utility',
    priority: 'low',
    flexibility: 0.6,
    penaltyRate: 0.02,
    penaltyPerDay: 1,
    relationshipTier: 'regular',
    relationshipScore: 5,
    priorityScore: 3.4,
  },
];

// ─── CASH FLOW ────────────────────────────────────────────────────────────────

export function getMockCashFlowData(days: 30 | 60 | 90): CashFlowPoint[] {
  const base = 845000;
  return Array.from({ length: days }).map((_, i) => {
    const date = addDays(TODAY, i);
    const trend = -2000 * i; // gradual burn
    const wave = Math.sin(i / 7) * 40000;
    const realistic = Math.max(0, base + trend + wave);
    const spread = 30000 + i * (days === 30 ? 800 : days === 60 ? 1200 : 1800);
    const optimistic = realistic + spread;
    const pessimistic = Math.max(0, realistic - spread * (days === 90 && i > 60 ? 2.5 : 1.2));
    const actual = i < 5 ? base + trend + wave + (Math.random() * 20000 - 10000) : undefined;
    return {
      date: format(date, 'MMM dd'),
      optimistic,
      realistic,
      pessimistic,
      actual,
    };
  });
}

// ─── FINANCIAL HEALTH COMPONENTS ─────────────────────────────────────────────

export const HEALTH_COMPONENTS = {
  liquidity: { score: 70, weight: 30, label: 'Liquidity Score', detail: '42 days runway → score 70' },
  obligations: { score: 65, weight: 25, label: 'Obligations Score', detail: '1 overdue obligation → penalised' },
  revenue: { score: 75, weight: 25, label: 'Revenue Trend', detail: '+8.1% MoM → positive trend' },
  risk: { score: 60, weight: 20, label: 'Risk Score', detail: '2 HIGH-risk obligations out of 7' },
};

export function computeHealthScore(): number {
  const { liquidity, obligations, revenue, risk } = HEALTH_COMPONENTS;
  return Math.round(
    (liquidity.score * liquidity.weight +
      obligations.score * obligations.weight +
      revenue.score * revenue.weight +
      risk.score * risk.weight) /
      100
  );
}
