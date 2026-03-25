// @BACKEND-PROMPT:
// Read CLAUDE.md. Build the reconciliation engine in backend/app/routers/reconciliation.py
// GET /api/v1/reconciliation/matches — returns all POTENTIAL and CONFIRMED ReconciliationMatch records
// POST /api/v1/reconciliation/auto-match — runs the matching algorithm across all PENDING transactions and PENDING obligations, creates ReconciliationMatch records
// Matching algorithm (mirror the frontend logic exactly for consistency):
//   score = 0
//   if amount_exact_match: score += 50
//   elif amount_within_1pct: score += 40
//   name_similarity = fuzz.token_sort_ratio(bank_description, vendor_name) / 100
//   score += name_similarity * 30
//   date_diff = abs((bank_date - obligation_due_date).days)
//   if date_diff <= 3: score += 20
//   elif date_diff <= 7: score += 10
//   if score >= 75: create ReconciliationMatch with status POTENTIAL
// POST /api/v1/reconciliation/matches/{id}/confirm — sets status CONFIRMED, updates transaction status to RECONCILED, updates obligation status to PAID, creates AuditLog entry
// POST /api/v1/reconciliation/matches/{id}/ignore — sets status IGNORED
// POST /api/v1/reconciliation/confirm-all — confirms all matches with confidence_score >= 90

// @DATABASE-PROMPT:
// Build an AuditLog trigger in PostgreSQL.
// Every time an Obligation status changes (PENDING → PAID, PENDING → DEFERRED, etc.), automatically insert a row into the audit_log table via a BEFORE UPDATE trigger on the obligations table.
// Same trigger on transactions table: any status change creates an audit entry.
// The audit_log table: {id, table_name, record_id, field_changed, old_value, new_value, changed_at, changed_by_user_id}
// Also create a view: v_audit_readable that joins audit_log with users and formats timestamps as IST.
// Build GET /api/v1/audit — returns paginated audit log for the authenticated business. Filterable by table_name, date range.

import type { Transaction, Obligation, ReconciliationMatch } from '../types';

function fuzzyNameScore(a: string, b: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const wordsA = normalize(a).split(/\s+/);
  const wordsB = normalize(b).split(/\s+/);
  const matched = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : matched.length / union;
}

function computeMatchScore(
  tx: Transaction,
  ob: Obligation
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  const txAmt = tx.amount;
  const obAmt = ob.amount;

  if (txAmt === obAmt) {
    score += 50;
    reasons.push('Exact amount match');
  } else if (Math.abs(txAmt - obAmt) / obAmt <= 0.01) {
    score += 40;
    reasons.push(`Amount within 1% (₹${Math.abs(txAmt - obAmt).toLocaleString('en-IN')} diff)`);
  }

  const nameSim = fuzzyNameScore(tx.description, ob.description);
  const namePoints = Math.round(nameSim * 30);
  if (namePoints > 0) {
    score += namePoints;
    reasons.push(`Name similarity ${Math.round(nameSim * 100)}%`);
  }

  const txDate = new Date(tx.date).getTime();
  const obDate = new Date(ob.dueDate).getTime();
  const dayDiff = Math.abs((txDate - obDate) / (1000 * 60 * 60 * 24));
  if (dayDiff <= 3) {
    score += 20;
    reasons.push('Date within 3 days');
  } else if (dayDiff <= 7) {
    score += 10;
    reasons.push('Date within 7 days');
  }

  return { score, reason: reasons.join(', ') || 'Partial similarity' };
}

export function autoMatch(
  transactions: Transaction[],
  obligations: Obligation[]
): ReconciliationMatch[] {
  const matches: ReconciliationMatch[] = [];
  const matchedTxIds = new Set<string>();
  const matchedObIds = new Set<string>();

  const expenses = transactions.filter((t) => t.type === 'expense' && t.status !== 'reconciled');
  const pending = obligations.filter((o) => o.status === 'unpaid' || o.status === 'overdue');

  for (const tx of expenses) {
    let best: { score: number; ob: Obligation; reason: string } | null = null;
    for (const ob of pending) {
      if (matchedObIds.has(ob.id)) continue;
      const { score, reason } = computeMatchScore(tx, ob);
      if (score >= 75 && (!best || score > best.score)) {
        best = { score, ob, reason };
      }
    }
    if (best && !matchedTxIds.has(tx.id)) {
      matchedTxIds.add(tx.id);
      matchedObIds.add(best.ob.id);
      matches.push({
        id: `m-${tx.id}-${best.ob.id}`,
        matchId: `MATCH-${matches.length + 1001}`,
        bankDebit: {
          id: tx.id,
          description: tx.description,
          date: tx.date,
          amount: tx.amount,
        },
        obligation: {
          id: best.ob.id,
          description: best.ob.description,
          date: best.ob.dueDate,
          amount: best.ob.amount,
        },
        confidence: Math.min(best.score, 100),
        matchReason: best.reason,
        status: 'POTENTIAL',
      });
    }
  }

  return matches;
}

export function getUnmatchedDebits(
  transactions: Transaction[],
  matches: ReconciliationMatch[]
): Transaction[] {
  const matchedIds = new Set(matches.map((m) => m.bankDebit.id));
  return transactions.filter(
    (t) => t.type === 'expense' && t.status !== 'reconciled' && !matchedIds.has(t.id)
  );
}

export function getUnmatchedObligations(
  obligations: Obligation[],
  matches: ReconciliationMatch[]
): Obligation[] {
  const matchedIds = new Set(matches.map((m) => m.obligation.id));
  return obligations.filter(
    (o) =>
      (o.status === 'unpaid' || o.status === 'overdue') &&
      !matchedIds.has(o.id)
  );
}
