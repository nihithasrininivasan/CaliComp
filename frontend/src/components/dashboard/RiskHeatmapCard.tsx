import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { Card } from '../ui/Common';
import { MOCK_OBLIGATIONS } from '../../services/mockData';
import type { Obligation } from '../../types';
import { differenceInDays } from 'date-fns';

type RiskLevel = 'HIGH' | 'MODERATE' | 'LOW';

interface RiskItem {
  id: string;
  name: string;
  risk: RiskLevel;
  daysUntilDue: number;
  amount: number;
}

function computeRisk(ob: Obligation): RiskLevel {
  const today = new Date();
  const due = new Date(ob.dueDate);
  const daysUntil = differenceInDays(due, today);
  const flex = ob.flexibility; // 0–1

  if (ob.status === 'overdue') return 'HIGH';
  if (daysUntil <= 3 && flex < 0.2) return 'HIGH';
  if (daysUntil <= 7 && flex < 0.5) return 'MODERATE';
  if (daysUntil <= 14 || flex > 0.7) return 'LOW';
  return 'LOW';
}

const RISK_CONFIG: Record<RiskLevel, { dot: string; badge: string; bg: string; border: string }> = {
  HIGH:     { dot: 'bg-red-500',   badge: 'text-red-400',   bg: 'bg-red-900/10',   border: 'border-red-900/20'   },
  MODERATE: { dot: 'bg-amber-500', badge: 'text-amber-400', bg: 'bg-amber-900/10', border: 'border-amber-900/20' },
  LOW:      { dot: 'bg-green-500', badge: 'text-green-400', bg: 'bg-green-900/10', border: 'border-green-900/20' },
};

export function RiskHeatmapCard() {
  const items = useMemo<RiskItem[]>(() =>
    MOCK_OBLIGATIONS
      .filter((o) => o.status !== 'paid')
      .map((o) => ({
        id: o.id,
        name: o.description,
        risk: computeRisk(o),
        daysUntilDue: differenceInDays(new Date(o.dueDate), new Date()),
        amount: o.amount,
      }))
      .sort((a, b) => {
        const order: Record<RiskLevel, number> = { HIGH: 0, MODERATE: 1, LOW: 2 };
        return order[a.risk] - order[b.risk];
      }),
    []
  );

  const counts = useMemo(() => ({
    high:     items.filter((i) => i.risk === 'HIGH').length,
    moderate: items.filter((i) => i.risk === 'MODERATE').length,
    low:      items.filter((i) => i.risk === 'LOW').length,
  }), [items]);

  return (
    <Card title="Risk Heatmap" subtitle="Computed from upcoming obligations">
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-4 text-[10px] font-black uppercase tracking-wider">
        <span className="text-red-400">{counts.high} High</span>
        <span className="text-gray-700">·</span>
        <span className="text-amber-400">{counts.moderate} Moderate</span>
        <span className="text-gray-700">·</span>
        <span className="text-green-400">{counts.low} Low</span>
      </div>

      <div className="space-y-2.5">
        {items.map(({ id, name, risk, daysUntilDue, amount }) => {
          const cfg = RISK_CONFIG[risk];
          const dueLabel = daysUntilDue < 0
            ? `${Math.abs(daysUntilDue)}d overdue`
            : daysUntilDue === 0
              ? 'Due today'
              : `${daysUntilDue}d left`;

          return (
            <div
              key={id}
              className={clsx(
                'flex items-center justify-between p-3 rounded-xl border',
                cfg.bg, cfg.border
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-gray-200 truncate block">{name}</span>
                  <span className="text-[9px] text-gray-500">{dueLabel} · ₹{amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <span className={clsx('text-[10px] font-black shrink-0 ml-2', cfg.badge)}>{risk}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
