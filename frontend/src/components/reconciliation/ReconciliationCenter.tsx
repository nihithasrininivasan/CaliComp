// @BACKEND-PROMPT:
// Read CLAUDE.md. Wire this component to:
//   GET  /api/v1/reconciliation/matches        — seed POTENTIAL matches
//   POST /api/v1/reconciliation/auto-match     — re-run server-side matching
//   POST /api/v1/reconciliation/matches/{id}/confirm
//   POST /api/v1/reconciliation/matches/{id}/ignore
//   POST /api/v1/reconciliation/confirm-all    — confirm all with confidence >= 90

import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle, X, Zap, Link2, AlertCircle, RefreshCw, ChevronDown,
} from 'lucide-react';
import { Button, Badge } from '../ui/Common';
import { useTransactionStore } from '../../store/transactionStore';
import { useToast } from '../../context/ToastContext';
import { MOCK_OBLIGATIONS } from '../../services/mockData';
import {
  autoMatch,
  getUnmatchedDebits,
  getUnmatchedObligations,
} from '../../services/reconciliation';
import type { ReconciliationMatch, Transaction, Obligation } from '../../types';

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? 'bg-green-900/30 text-green-300 border border-green-800' :
    score >= 75 ? 'bg-amber-900/30 text-amber-300 border border-amber-800' :
                  'bg-red-900/30   text-red-300   border border-red-800';
  return (
    <span className={clsx('text-[10px] font-black px-2 py-0.5 rounded-md', cls)}>
      {score}% match
    </span>
  );
}

// ── Match card (left column) ──────────────────────────────────────────────────
interface MatchCardProps {
  match:     ReconciliationMatch;
  onConfirm: (id: string) => void;
  onIgnore:  (id: string) => void;
}

function MatchCard({ match, onConfirm, onIgnore }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isConfirmed = match.status === 'CONFIRMED';
  const isIgnored   = match.status === 'IGNORED';

  return (
    <div
      className={clsx(
        'border rounded-2xl overflow-hidden transition-all',
        isConfirmed ? 'border-green-900/50 bg-green-900/5' :
        isIgnored   ? 'border-gray-800/50 bg-gray-900/20 opacity-50' :
                      'border-gray-800 bg-[#111827]'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="shrink-0">
          {isConfirmed ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : isIgnored ? (
            <X className="w-4 h-4 text-gray-600" />
          ) : (
            <Link2 className="w-4 h-4 text-blue-400" />
          )}
        </div>

        {/* Bank debit side */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-gray-100 truncate">{match.bankDebit.description}</p>
          <p className="text-[10px] text-gray-500">{match.bankDebit.date} · ₹{match.bankDebit.amount.toLocaleString('en-IN')}</p>
        </div>

        {/* Arrow */}
        <span className="text-gray-600 text-xs shrink-0">↔</span>

        {/* Obligation side */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs font-black text-gray-100 truncate">{match.obligation.description}</p>
          <p className="text-[10px] text-gray-500">{match.obligation.date} · ₹{match.obligation.amount.toLocaleString('en-IN')}</p>
        </div>

        <ConfidenceBadge score={match.confidence} />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1 text-gray-600 hover:text-gray-300 transition-colors"
        >
          <ChevronDown className={clsx('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-800/60 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Match reason</span>
            <span className="text-[10px] text-gray-300">{match.matchReason}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-900 rounded-xl">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Bank Debit</p>
              <p className="text-xs font-bold text-gray-200">{match.bankDebit.description}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{match.bankDebit.date}</p>
              <p className="text-sm font-black text-red-400 mt-1">-₹{match.bankDebit.amount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-gray-900 rounded-xl">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Obligation</p>
              <p className="text-xs font-bold text-gray-200">{match.obligation.description}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Due {match.obligation.date}</p>
              <p className="text-sm font-black text-amber-400 mt-1">₹{match.obligation.amount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {!isConfirmed && !isIgnored && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                className="flex-1 text-xs py-2 flex items-center justify-center gap-1.5"
                onClick={() => onConfirm(match.id)}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm Match
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-xs py-2 flex items-center justify-center gap-1.5 text-gray-400"
                onClick={() => onIgnore(match.id)}
              >
                <X className="w-3.5 h-3.5" /> Ignore
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Unmatched item row ─────────────────────────────────────────────────────────
function UnmatchedTxRow({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-bold text-gray-300 truncate">{tx.description}</p>
        <p className="text-[10px] text-gray-600">{tx.date}</p>
      </div>
      <span className="text-xs font-black text-red-400 shrink-0 ml-2">-₹{tx.amount.toLocaleString('en-IN')}</span>
    </div>
  );
}

function UnmatchedObRow({ ob }: { ob: Obligation }) {
  const overdue = ob.status === 'overdue';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800/50 last:border-0">
      <div className="min-w-0 flex items-center gap-2">
        {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-300 truncate">{ob.description}</p>
          <p className="text-[10px] text-gray-600">Due {ob.dueDate}</p>
        </div>
      </div>
      <span className={clsx('text-xs font-black shrink-0 ml-2', overdue ? 'text-red-400' : 'text-amber-400')}>
        ₹{ob.amount.toLocaleString('en-IN')}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ReconciliationCenter() {
  const { transactions, updateTransactionStatus } = useTransactionStore();
  const { showToast } = useToast();

  const obligations = MOCK_OBLIGATIONS;

  // Local match state (mirrors what the backend would persist)
  const [matchOverrides, setMatchOverrides] = useState<Record<string, ReconciliationMatch['status']>>({});

  const rawMatches = useMemo(
    () => autoMatch(transactions, obligations),
    [transactions, obligations]
  );

  const matches: ReconciliationMatch[] = useMemo(
    () => rawMatches.map(m => ({ ...m, status: matchOverrides[m.id] ?? m.status })),
    [rawMatches, matchOverrides]
  );

  const unmatchedDebits      = useMemo(() => getUnmatchedDebits(transactions, matches.filter(m => m.status !== 'IGNORED')),      [transactions, matches]);
  const unmatchedObligations = useMemo(() => getUnmatchedObligations(obligations, matches.filter(m => m.status !== 'IGNORED')), [obligations, matches]);

  const confirmedCount = matches.filter(m => m.status === 'CONFIRMED').length;
  const pendingCount   = matches.filter(m => m.status === 'POTENTIAL').length;
  const autoHighConf   = matches.filter(m => m.status === 'POTENTIAL' && m.confidence >= 90).length;

  function handleConfirm(id: string) {
    const m = matches.find(x => x.id === id);
    if (!m) return;
    setMatchOverrides(prev => ({ ...prev, [id]: 'CONFIRMED' }));
    updateTransactionStatus(m.bankDebit.id, 'reconciled');
    showToast('Match confirmed — transaction marked reconciled.');
    // TODO: POST /api/v1/reconciliation/matches/{id}/confirm
  }

  function handleIgnore(id: string) {
    setMatchOverrides(prev => ({ ...prev, [id]: 'IGNORED' }));
    showToast('Match ignored.', 'error');
    // TODO: POST /api/v1/reconciliation/matches/{id}/ignore
  }

  function handleConfirmAll() {
    const toConfirm = matches.filter(m => m.status === 'POTENTIAL' && m.confidence >= 90);
    const overrides: Record<string, ReconciliationMatch['status']> = {};
    for (const m of toConfirm) {
      overrides[m.id] = 'CONFIRMED';
      updateTransactionStatus(m.bankDebit.id, 'reconciled');
    }
    setMatchOverrides(prev => ({ ...prev, ...overrides }));
    showToast(`${toConfirm.length} high-confidence matches confirmed.`);
    // TODO: POST /api/v1/reconciliation/confirm-all
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Reconciliation</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">
            Match bank debits to obligations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {autoHighConf > 0 && (
            <Button
              variant="primary"
              className="flex items-center gap-2 text-xs"
              onClick={handleConfirmAll}
            >
              <Zap className="w-3.5 h-3.5" />
              Confirm All High Confidence ({autoHighConf})
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run Auto-Match
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Potential Matches', value: pendingCount,   color: 'text-blue-400'  },
          { label: 'Confirmed',         value: confirmedCount, color: 'text-green-400' },
          { label: 'Unmatched Debits',  value: unmatchedDebits.length, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111827] border border-gray-800 rounded-2xl px-5 py-4 text-center">
            <p className={clsx('text-2xl font-black', color)}>{value}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: potential match cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Potential Matches</h3>
            <span className="text-[10px] text-gray-600">{matches.length} total</span>
          </div>

          {matches.length === 0 ? (
            <div className="bg-[#111827] border border-gray-800 rounded-2xl px-6 py-10 text-center">
              <p className="text-sm font-bold text-gray-500">No matches found for current transactions.</p>
              <p className="text-xs text-gray-600 mt-1">Add expense transactions to see auto-matched obligations.</p>
            </div>
          ) : (
            matches.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                onConfirm={handleConfirm}
                onIgnore={handleIgnore}
              />
            ))
          )}
        </div>

        {/* Right: unmatched lists */}
        <div className="space-y-4">
          {/* Unmatched debits */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unmatched Debits</h3>
              <Badge variant="warning">{unmatchedDebits.length}</Badge>
            </div>
            <div className="px-4 py-1 max-h-64 overflow-y-auto">
              {unmatchedDebits.length === 0 ? (
                <p className="text-[10px] text-gray-600 text-center py-4">All debits matched</p>
              ) : (
                unmatchedDebits.map(tx => <UnmatchedTxRow key={tx.id} tx={tx} />)
              )}
            </div>
          </div>

          {/* Unmatched obligations */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unmatched Obligations</h3>
              <Badge variant="danger">{unmatchedObligations.length}</Badge>
            </div>
            <div className="px-4 py-1 max-h-64 overflow-y-auto">
              {unmatchedObligations.length === 0 ? (
                <p className="text-[10px] text-gray-600 text-center py-4">All obligations matched</p>
              ) : (
                unmatchedObligations.map(ob => <UnmatchedObRow key={ob.id} ob={ob} />)
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl px-4 py-3 space-y-2">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Confidence Legend</p>
            {[
              { label: '90–100%', cls: 'text-green-300 bg-green-900/30 border border-green-800' },
              { label: '75–89%',  cls: 'text-amber-300 bg-amber-900/30 border border-amber-800' },
            ].map(({ label, cls }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={clsx('text-[10px] font-black px-2 py-0.5 rounded-md', cls)}>{label}</span>
                <span className="text-[10px] text-gray-500">{label === '90–100%' ? 'Auto-confirmable' : 'Review recommended'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
