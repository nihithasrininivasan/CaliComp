import React from 'react';
import { clsx } from 'clsx';
import { differenceInDays } from 'date-fns';
import { BrainCircuit, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Card } from '../ui/Common';
import { MOCK_OBLIGATIONS } from '../../services/mockData';
import type { Obligation } from '../../types';

// ── Priority reason generator ─────────────────────────────────────────────────
function buildReason(ob: Obligation, daysUntilDue: number): string {
  const parts: string[] = [];

  if (ob.flexibility === 0)          parts.push('zero flexibility');
  if (ob.penaltyRate >= 0.18)        parts.push(`${(ob.penaltyRate * 100).toFixed(0)}% p.a. statutory penalty`);
  else if (ob.penaltyRate >= 0.1)    parts.push(`${(ob.penaltyRate * 100).toFixed(0)}% p.a. penalty`);
  if (ob.type === 'gst' || ob.type === 'tds') parts.push('statutory deadline');
  if (ob.type === 'emi')             parts.push('credit score risk');
  if (ob.relationshipTier === 'strategic') parts.push('strategic vendor');
  if (daysUntilDue < 0)             parts.push(`${Math.abs(daysUntilDue)}d overdue`);
  else if (daysUntilDue <= 3)       parts.push(`due in ${daysUntilDue}d`);

  return parts.length ? parts.join(', ') : 'medium priority';
}

function rankIcon(rank: number) {
  if (rank === 1) return { icon: AlertCircle, cls: 'text-red-400 bg-red-900/20 border-red-900/30' };
  if (rank === 2) return { icon: AlertCircle, cls: 'text-amber-400 bg-amber-900/20 border-amber-900/30' };
  return            { icon: Shield,       cls: 'text-blue-400 bg-blue-900/20 border-blue-900/30' };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PaymentPriorityCard() {
  const today = new Date('2026-03-25');

  const ranked = [...MOCK_OBLIGATIONS]
    .filter(o => o.status !== 'paid')
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, 4);

  const totalOutstanding = MOCK_OBLIGATIONS
    .filter(o => o.status !== 'paid')
    .reduce((s, o) => s + o.amount, 0);

  return (
    <Card title="Payment Priority" subtitle="LP-ranked by penalty · flexibility · relationship">
      <div className="space-y-4">

        {/* Ranked list */}
        {ranked.map((ob, i) => {
          const rank      = i + 1;
          const daysUntil = differenceInDays(new Date(ob.dueDate), today);
          const reason    = buildReason(ob, daysUntil);
          const { icon: Icon, cls } = rankIcon(rank);

          return (
            <div key={ob.id} className="flex gap-3">
              <div className={clsx('w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5', cls)}>
                <Icon className={clsx('w-3.5 h-3.5', cls.split(' ')[0])} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={clsx('text-[9px] font-black uppercase', cls.split(' ')[0])}>#{rank}</span>
                  <p className="text-xs font-bold text-gray-100">{ob.description}</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  <span className="text-white font-bold">₹{ob.amount.toLocaleString('en-IN')}</span>
                  {' — '}{reason}.
                </p>
              </div>
            </div>
          );
        })}

        {/* AI note */}
        <div className="pt-3 border-t border-gray-800 flex gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-900/20 border border-purple-900/30 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Total outstanding:{' '}
            <span className="text-white font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</span>.
            {' '}Prioritise statutory payments first to avoid compounding penalties.
            {' '}
            <span className="text-gray-600">
              {/* TODO: replace with LP solver output from GET /api/v1/obligations/priority */}
              Mock ranking — AI engine connects in production.
            </span>
          </p>
        </div>

        {/* Penalty summary */}
        <div className="p-3 bg-red-900/10 border border-red-900/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Daily Penalty Exposure</span>
          </div>
          <p className="text-lg font-black text-white">
            ₹{MOCK_OBLIGATIONS
              .filter(o => o.status === 'overdue')
              .reduce((s, o) => s + (o.penaltyPerDay ?? 0), 0)
              .toLocaleString('en-IN')}
            <span className="text-xs font-bold text-gray-500">/day</span>
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">Accruing on overdue obligations only</p>
        </div>
      </div>
    </Card>
  );
}
