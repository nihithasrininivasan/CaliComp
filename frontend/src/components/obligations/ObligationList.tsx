// @BACKEND-PROMPT:
// Read CLAUDE.md. Wire these actions to the API:
//   PATCH /api/v1/obligations/{id}           — body: { status: 'paid' }
//   POST  /api/v1/obligations/{id}/defer     — body: { new_due_date, reason }
//   GET   /api/v1/obligations/{id}/email     — returns pre-written vendor email draft

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { format, addDays } from 'date-fns';
import {
  AlertTriangle, Clock, CheckCircle, ChevronDown,
  CheckSquare, CalendarClock, Mail, X,
} from 'lucide-react';
import { Badge, Button } from '../ui/Common';
import { MOCK_OBLIGATIONS } from '../../services/mockData';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import type { Obligation } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────
type LocalStatus = Obligation['status'];

interface LocalOverride {
  status:      LocalStatus;
  deferredTo?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIORITY_VARIANT: Record<Obligation['priority'], 'danger' | 'warning' | 'default'> = {
  high:   'danger',
  medium: 'warning',
  low:    'default',
};

const STATUS_ICON: Record<LocalStatus, React.ElementType> = {
  unpaid:   Clock,
  overdue:  AlertTriangle,
  paid:     CheckCircle,
  deferred: CalendarClock,
};

const STATUS_COLOR: Record<LocalStatus, string> = {
  unpaid:   'text-gray-400',
  overdue:  'text-red-400',
  paid:     'text-green-400',
  deferred: 'text-amber-400',
};

const TYPE_LABEL: Record<Obligation['type'], string> = {
  gst:     'GST',
  tds:     'TDS',
  emi:     'EMI',
  vendor:  'Vendor',
  payroll: 'Payroll',
  utility: 'Utility',
  other:   'Other',
};

// ── Email modal ───────────────────────────────────────────────────────────────
interface EmailModalProps {
  ob:         Obligation;
  deferDays:  number;
  newDueDate: string;
  onClose:    () => void;
}

function EmailModal({ ob, deferDays, newDueDate, onClose }: EmailModalProps) {
  const draft = [
    `Dear ${ob.vendorName ?? ob.description},`,
    '',
    `We are writing regarding our outstanding payment of ₹${ob.amount.toLocaleString('en-IN')} originally due on ${ob.dueDate}.`,
    '',
    deferDays > 0
      ? `Due to current cash flow conditions, we kindly request an extension of ${deferDays} days, making the revised due date ${newDueDate}. We assure you this is a temporary measure.`
      : `We would like to confirm that payment of ₹${ob.amount.toLocaleString('en-IN')} will be processed on ${ob.dueDate}.`,
    '',
    `We value our continued business relationship and appreciate your understanding.`,
    '',
    'Best regards,',
    'Accounts Payable',
    'Mehta Fabrics Pvt. Ltd.',
  ].join('\n');

  function copyToClipboard() {
    navigator.clipboard.writeText(draft);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-[#0D1220] border border-gray-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-black text-white">Vendor Email Draft</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Review and copy to your email client</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              {draft}
            </pre>
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1 text-xs py-2.5" onClick={copyToClipboard}>
                Copy to Clipboard
              </Button>
              <Button variant="outline" className="text-xs py-2.5" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Obligation row ─────────────────────────────────────────────────────────────
interface RowProps {
  ob:                  Obligation;
  override:            LocalOverride | undefined;
  onMarkPaid:          (id: string) => void;
  onDefer:             (id: string, newDate: string) => void;
  onEmail:             (ob: Obligation, days: number, newDate: string) => void;
  cashBelowEF:         boolean;
  emergencyFundTarget: number;
}

function ObligationRow({ ob, override, onMarkPaid, onDefer, onEmail, cashBelowEF, emergencyFundTarget }: RowProps) {
  const status      = override?.status ?? ob.status;
  const deferredTo  = override?.deferredTo;
  const [expanded,  setExpanded]  = useState(false);
  const [deferDate, setDeferDate] = useState(
    format(addDays(new Date(ob.dueDate), 7), 'yyyy-MM-dd')
  );

  const Icon         = STATUS_ICON[status];
  const isPaid       = status === 'paid';
  const canDefer     = ob.flexibility > 0 && !isPaid && status !== 'deferred';
  const canEmail     = ob.type === 'vendor' || ob.type === 'utility';
  const deferDaysDiff = deferDate && ob.dueDate
    ? Math.round((new Date(deferDate).getTime() - new Date(ob.dueDate).getTime()) / 86_400_000)
    : 0;

  return (
    <div className={clsx('border-b border-gray-800/50 last:border-0 transition-colors', isPaid && 'opacity-60')}>
      {/* Main row */}
      <button
        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-800/20 transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <Icon className={clsx('w-4 h-4 shrink-0', STATUS_COLOR[status])} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-xs font-bold text-gray-100">{ob.description}</p>
            <Badge variant={PRIORITY_VARIANT[ob.priority]}>{ob.priority}</Badge>
            <span className="text-[9px] font-black text-gray-700 uppercase">{TYPE_LABEL[ob.type]}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] text-gray-500">
              {status === 'deferred' && deferredTo ? `Deferred to ${deferredTo}` : `Due ${ob.dueDate}`}
            </span>
            <span className="text-[10px] text-gray-600">Flexibility: {Math.round(ob.flexibility * 100)}%</span>
            <span className="text-[10px] text-gray-600">Penalty: {(ob.penaltyRate * 100).toFixed(0)}% p.a.</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-black text-white">₹{ob.amount.toLocaleString('en-IN')}</p>
          <p className={clsx('text-[9px] font-bold uppercase', STATUS_COLOR[status])}>{status}</p>
        </div>

        <ChevronDown className={clsx('w-4 h-4 text-gray-600 shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Expanded actions */}
      {expanded && !isPaid && (
        <div className="px-6 pb-5 pt-1 bg-gray-900/20 space-y-4 border-t border-gray-800/40">
          <div className="flex flex-wrap gap-2">

            {/* Mark as Paid */}
            <button
              onClick={() => onMarkPaid(ob.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-900/20 border border-green-900/40 text-green-300 text-xs font-bold hover:bg-green-900/30 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Mark as Paid
            </button>

            {/* Generate Email */}
            {canEmail && (
              <button
                onClick={() => onEmail(ob, deferDaysDiff, deferDate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900/20 border border-blue-900/40 text-blue-300 text-xs font-bold hover:bg-blue-900/30 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Generate Email
              </button>
            )}
          </div>

          {/* Defer section */}
          {canDefer ? (
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-gray-200">Defer Payment</span>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    New Due Date
                  </label>
                  <input
                    type="date"
                    value={deferDate}
                    min={ob.dueDate}
                    onChange={e => setDeferDate(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
                <div className="shrink-0">
                  {deferDaysDiff > 0 && (ob.penaltyPerDay ?? 0) > 0 && (
                    <p className="text-[10px] text-amber-400 font-bold mb-2">
                      +₹{((ob.penaltyPerDay ?? 0) * deferDaysDiff).toLocaleString('en-IN')} penalty
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="text-xs py-2 border-amber-800 text-amber-300 hover:text-amber-200"
                    onClick={() => onDefer(ob.id, deferDate)}
                  >
                    Confirm Deferral
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-gray-600">
                Max flexibility: {Math.round(ob.flexibility * 30)} days · Penalty: ₹{ob.penaltyPerDay ?? 0}/day
              </p>
              <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-800">
                Note: Deferring does not increase your emergency fund. The deferred amount remains a future obligation.
              </p>
              {cashBelowEF && (
                <p className="text-[10px] text-amber-400 font-bold">
                  ⚠️ Your cash is currently below your emergency fund target (₹{emergencyFundTarget.toLocaleString('en-IN')}). Deferring rather than paying may be the right choice to protect your buffer.
                </p>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-gray-600 pl-1">
              {ob.type === 'gst' || ob.type === 'tds'
                ? 'Statutory payment — deferral not permitted'
                : ob.flexibility === 0
                ? 'Zero flexibility — deferral not available'
                : 'Already deferred'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const CASH_BALANCE = 845000;

export function ObligationList() {
  const { showToast } = useToast();
  const { emergencyFund } = useSettings();
  const cashBelowEF = CASH_BALANCE < emergencyFund.target;
  const [overrides, setOverrides] = useState<Record<string, LocalOverride>>({});
  const [emailTarget, setEmailTarget] = useState<{ ob: Obligation; days: number; newDate: string } | null>(null);

  const sorted = [...MOCK_OBLIGATIONS].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const pendingCount = sorted.filter(o => {
    const s = overrides[o.id]?.status ?? o.status;
    return s !== 'paid';
  }).length;

  function handleMarkPaid(id: string) {
    setOverrides(prev => ({ ...prev, [id]: { status: 'paid' } }));
    showToast('Obligation marked as paid.');
    // TODO: PATCH /api/v1/obligations/{id} { status: 'paid' }
  }

  function handleDefer(id: string, newDate: string) {
    setOverrides(prev => ({ ...prev, [id]: { status: 'deferred', deferredTo: newDate } }));
    showToast(`Payment deferred to ${newDate}.`);
    // TODO: POST /api/v1/obligations/{id}/defer { new_due_date: newDate }
  }

  return (
    <>
      {emailTarget && (
        <EmailModal
          ob={emailTarget.ob}
          deferDays={emailTarget.days}
          newDueDate={emailTarget.newDate}
          onClose={() => setEmailTarget(null)}
        />
      )}

      <div className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-100">Upcoming Obligations</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Click any row to expand actions</p>
          </div>
          <Badge variant="warning">{pendingCount} pending</Badge>
        </div>

        <div>
          {sorted.map(ob => (
            <ObligationRow
              key={ob.id}
              ob={ob}
              override={overrides[ob.id]}
              onMarkPaid={handleMarkPaid}
              onDefer={handleDefer}
              onEmail={(ob, days, newDate) => setEmailTarget({ ob, days, newDate })}
              cashBelowEF={cashBelowEF}
              emergencyFundTarget={emergencyFund.target}
            />
          ))}
        </div>
      </div>
    </>
  );
}
