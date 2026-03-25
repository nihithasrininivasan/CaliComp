import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { format, isPast, addDays } from 'date-fns';
import {
  AlertTriangle, ChevronDown, ChevronUp, Link2, PlusCircle,
  CheckCircle, Flag, X, Info,
} from 'lucide-react';
import { Badge, Button } from '../ui/Common';
import { getMockTransactions, MOCK_OBLIGATIONS } from '../../services/mockData';
import { autoMatch, getUnmatchedDebits, getUnmatchedObligations } from '../../services/reconciliation';
import { useToast } from '../../context/ToastContext';
import type { Transaction, Obligation } from '../../types';

// ── helpers ───────────────────────────────────────────────────────────────────

function dueBadge(dueDate: string): { label: string; variant: 'danger' | 'warning' | 'default' } {
  const now = new Date();
  const due = new Date(dueDate);
  if (isPast(due)) return { label: 'OVERDUE', variant: 'danger' };
  const sevenDays = addDays(now, 7);
  if (due <= sevenDays) return { label: 'UPCOMING', variant: 'warning' };
  return { label: 'FUTURE', variant: 'default' };
}

// ── Link-to-Obligation modal ──────────────────────────────────────────────────

interface LinkModalProps {
  debit: Transaction;
  obligations: Obligation[];
  onConfirm: (debitId: string, obId: string) => void;
  onClose: () => void;
}

function LinkObligationModal({ debit, obligations, onConfirm, onClose }: LinkModalProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...obligations].sort(
        (a, b) => Math.abs(a.amount - debit.amount) - Math.abs(b.amount - debit.amount),
      ),
    [obligations, debit.amount],
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-[#0D1220] border border-gray-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-black text-white">Link to Obligation</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Debit: {debit.description} · ₹{debit.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
            {sorted.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-6">No pending obligations available.</p>
            )}
            {sorted.map(ob => {
              const diff = Math.abs(ob.amount - debit.amount);
              return (
                <button
                  key={ob.id}
                  onClick={() => setSelected(ob.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-xl border transition-colors',
                    selected === ob.id
                      ? 'border-blue-600 bg-blue-900/20'
                      : 'border-gray-800 bg-gray-900/40 hover:border-gray-700',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-100">{ob.description}</span>
                    <span className="text-xs font-black text-white">₹{ob.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-500">Due {ob.dueDate}</span>
                    {diff === 0 ? (
                      <span className="text-[10px] text-green-400 font-bold">Exact match</span>
                    ) : (
                      <span className="text-[10px] text-gray-600">
                        ₹{diff.toLocaleString('en-IN')} diff
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex gap-2">
            <Button
              variant="primary"
              className="flex-1 text-xs py-2.5"
              disabled={!selected}
              onClick={() => selected && onConfirm(debit.id, selected)}
            >
              Confirm Link
            </Button>
            <Button variant="outline" className="text-xs py-2.5" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Create-New-Obligation modal ───────────────────────────────────────────────

interface CreateObModalProps {
  debit: Transaction;
  onConfirm: (debitId: string, name: string, category: string) => void;
  onClose: () => void;
}

function CreateObligationModal({ debit, onConfirm, onClose }: CreateObModalProps) {
  const [name, setName] = useState(debit.description);
  const [category, setCategory] = useState<Obligation['type']>('vendor');

  const CATEGORIES: { value: Obligation['type']; label: string }[] = [
    { value: 'vendor', label: 'Vendor' },
    { value: 'gst', label: 'GST' },
    { value: 'tds', label: 'TDS' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'emi', label: 'EMI' },
    { value: 'utility', label: 'Utility' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-[#0D1220] border border-gray-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-black text-white">Create New Obligation</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">This obligation will be marked as PAID immediately.</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Obligation Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Amount
                </label>
                <p className="text-sm font-black text-red-400">₹{debit.amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Date
                </label>
                <p className="text-sm text-gray-300">{debit.date}</p>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Obligation['type'])}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex gap-2">
            <Button
              variant="primary"
              className="flex-1 text-xs py-2.5"
              disabled={!name.trim()}
              onClick={() => onConfirm(debit.id, name.trim(), category)}
            >
              Create & Mark Paid
            </Button>
            <Button variant="outline" className="text-xs py-2.5" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Mark-Paid-Externally confirmation modal ───────────────────────────────────

interface MarkPaidModalProps {
  obligation: Obligation;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

function MarkPaidExternallyModal({ obligation, onConfirm, onClose }: MarkPaidModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-[#0D1220] border border-gray-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-black text-white">Mark as Paid Externally</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              Confirm this payment was made <span className="text-white font-bold">outside the tracked bank account</span>{' '}
              (e.g. cash, cheque, UPI). This will mark the obligation as PAID without a matching bank debit.
            </p>
            <div className="p-3 bg-gray-900 rounded-xl border border-gray-800">
              <p className="text-xs font-bold text-gray-100">{obligation.description}</p>
              <p className="text-sm font-black text-white mt-1">₹{obligation.amount.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Due {obligation.dueDate}</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-800 flex gap-2">
            <Button variant="primary" className="flex-1 text-xs py-2.5" onClick={() => onConfirm(obligation.id)}>
              Confirm External Payment
            </Button>
            <Button variant="outline" className="text-xs py-2.5" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type ResolvedDebit = { type: 'linked'; obId: string } | { type: 'created'; name: string };

export function UnresolvedItems() {
  const { showToast } = useToast();

  // ── data ──────────────────────────────────────────────────────────────────
  const allTransactions = useMemo(() => getMockTransactions(90), []);
  const allObligations = MOCK_OBLIGATIONS;
  const matches = useMemo(() => autoMatch(allTransactions, allObligations), [allTransactions, allObligations]);
  const rawUnmatchedDebits = useMemo(() => getUnmatchedDebits(allTransactions, matches), [allTransactions, matches]);
  const rawUnmatchedObs = useMemo(() => getUnmatchedObligations(allObligations, matches), [allObligations, matches]);

  // ── local resolution state ────────────────────────────────────────────────
  const [resolvedDebits, setResolvedDebits] = useState<Record<string, ResolvedDebit>>({});
  const [resolvedObs, setResolvedObs] = useState<Record<string, 'paid_external' | 'flagged'>>({});

  // ── panel open/close ──────────────────────────────────────────────────────
  const [debitsOpen, setDebitsOpen] = useState(true);
  const [obsOpen, setObsOpen]       = useState(true);

  // ── modal state ───────────────────────────────────────────────────────────
  const [linkTarget,   setLinkTarget]   = useState<Transaction | null>(null);
  const [createTarget, setCreateTarget] = useState<Transaction | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Obligation | null>(null);

  // ── derived lists ─────────────────────────────────────────────────────────
  const unmatchedDebits = rawUnmatchedDebits.filter(t => !resolvedDebits[t.id]);
  const unmatchedObs    = rawUnmatchedObs.filter(o => !resolvedObs[o.id]);
  const flaggedObs      = rawUnmatchedObs.filter(o => resolvedObs[o.id] === 'flagged');

  // Obligations still PENDING (not resolved) for the Link modal
  const pendingObligations = allObligations.filter(
    o => (o.status === 'unpaid' || o.status === 'overdue') && !resolvedObs[o.id],
  );

  // ── handlers ─────────────────────────────────────────────────────────────
  function handleLinkConfirm(debitId: string, obId: string) {
    setResolvedDebits(p => ({ ...p, [debitId]: { type: 'linked', obId } }));
    setResolvedObs(p => ({ ...p, [obId]: 'paid_external' }));
    setLinkTarget(null);
    showToast('Debit linked to obligation. Obligation marked as PAID.', 'success');
  }

  function handleCreateConfirm(debitId: string, name: string) {
    setResolvedDebits(p => ({ ...p, [debitId]: { type: 'created', name } }));
    setCreateTarget(null);
    showToast(`Obligation "${name}" created and marked as PAID.`, 'success');
  }

  function handleMarkPaidExternal(id: string) {
    setResolvedObs(p => ({ ...p, [id]: 'paid_external' }));
    setMarkPaidTarget(null);
    showToast('Obligation marked as paid externally. Audit note added.', 'success');
  }

  function handleFlagDuplicate(id: string) {
    setResolvedObs(p => ({ ...p, [id]: 'flagged' }));
    showToast('Obligation flagged for review. Audit note added.', 'warning');
  }

  return (
    <>
      {/* ── modals ─────────────────────────────────────────────────────── */}
      {linkTarget && (
        <LinkObligationModal
          debit={linkTarget}
          obligations={pendingObligations}
          onConfirm={handleLinkConfirm}
          onClose={() => setLinkTarget(null)}
        />
      )}
      {createTarget && (
        <CreateObligationModal
          debit={createTarget}
          onConfirm={handleCreateConfirm}
          onClose={() => setCreateTarget(null)}
        />
      )}
      {markPaidTarget && (
        <MarkPaidExternallyModal
          obligation={markPaidTarget}
          onConfirm={handleMarkPaidExternal}
          onClose={() => setMarkPaidTarget(null)}
        />
      )}

      {/* ── section wrapper ────────────────────────────────────────────── */}
      <div className="space-y-5">
        {/* section header */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-base font-black text-white tracking-tight">Unresolved Items</h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
              Requires manual review
            </p>
          </div>
        </div>

        {/* ── banner ─────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 bg-amber-900/10 border border-amber-900/30 rounded-xl">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Resolving these items keeps your cash flow projections accurate. Unmatched debits may
            represent unrecorded expenses. Unmatched obligations may indicate payments made outside
            your tracked accounts.
          </p>
        </div>

        {/* ── two-panel grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Unmatched Bank Debits */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/20 transition-colors"
              onClick={() => setDebitsOpen(v => !v)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-100">Unmatched Bank Debits</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-red-900/30 text-red-400 border border-red-900/50">
                  {unmatchedDebits.length} Unmatched
                </span>
              </div>
              {debitsOpen
                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {debitsOpen && (
              <div className="border-t border-gray-800 divide-y divide-gray-800/50">
                {unmatchedDebits.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">All bank debits matched.</p>
                  </div>
                )}
                {unmatchedDebits.map(tx => (
                  <div key={tx.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-100 truncate">{tx.description}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{tx.date}</p>
                      </div>
                      <p className="text-sm font-black text-red-400 shrink-0">
                        −₹{tx.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLinkTarget(tx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-900/40 text-blue-300 text-[10px] font-bold hover:bg-blue-900/30 transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        Link to Obligation
                      </button>
                      <button
                        onClick={() => setCreateTarget(tx)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-bold hover:bg-gray-700 transition-colors"
                      >
                        <PlusCircle className="w-3 h-3" />
                        Create New Obligation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Unmatched Obligations */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/20 transition-colors"
              onClick={() => setObsOpen(v => !v)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-100">Unmatched Obligations</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-900/30 text-amber-400 border border-amber-900/50">
                  {unmatchedObs.length} Unmatched
                </span>
              </div>
              {obsOpen
                ? <ChevronUp className="w-4 h-4 text-gray-500" />
                : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {obsOpen && (
              <div className="border-t border-gray-800 divide-y divide-gray-800/50">
                {unmatchedObs.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">All obligations matched.</p>
                  </div>
                )}
                {unmatchedObs.map(ob => {
                  const badge = dueBadge(ob.dueDate);
                  return (
                    <div key={ob.id} className="px-5 py-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-xs font-bold text-gray-100 truncate">
                              {ob.vendorName ?? ob.description}
                            </p>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                          <p className="text-[10px] text-gray-500">Due {ob.dueDate}</p>
                        </div>
                        <p className="text-sm font-black text-white shrink-0">
                          ₹{ob.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setMarkPaidTarget(ob)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-900/40 text-green-300 text-[10px] font-bold hover:bg-green-900/30 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Mark as Paid Externally
                        </button>
                        <button
                          onClick={() => handleFlagDuplicate(ob.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-bold hover:bg-gray-700 transition-colors"
                        >
                          <Flag className="w-3 h-3" />
                          Flag as Duplicate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Flagged for Review ────────────────────────────────────────────── */}
        {flaggedObs.length > 0 && (
          <div className="bg-[#111827] rounded-2xl border border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800">
              <Flag className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-bold text-gray-300">Flagged for Review</span>
              <Badge variant="default">{flaggedObs.length}</Badge>
            </div>
            <div className="divide-y divide-gray-800/50">
              {flaggedObs.map(ob => (
                <div key={ob.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                  <div>
                    <p className="text-xs font-bold text-gray-300">{ob.vendorName ?? ob.description}</p>
                    <p className="text-[10px] text-gray-600">Due {ob.dueDate} · Audit: Flagged as duplicate by user</p>
                  </div>
                  <p className="text-xs font-black text-gray-400">₹{ob.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
