import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Card, Button, Badge } from '../ui/Common';
import { CheckCircle, AlertCircle, XCircle, GitMerge } from 'lucide-react';

interface RecItem {
  id: string;
  date: string;
  description: string;
  bankAmount: number;
  ledgerAmount: number | null;
  status: 'matched' | 'partial' | 'unmatched';
}

const ITEMS: RecItem[] = [
  { id: 'r1', date: '2024-03-20', description: 'Client Payment – ABC Corp',  bankAmount: 150000, ledgerAmount: 150000, status: 'matched'   },
  { id: 'r2', date: '2024-03-19', description: 'Office Rent',                bankAmount: 45000,  ledgerAmount: 45000,  status: 'matched'   },
  { id: 'r3', date: '2024-03-18', description: 'AWS Cloud Services',         bankAmount: 12500,  ledgerAmount: 12000,  status: 'partial'   },
  { id: 'r4', date: '2024-03-17', description: 'Consulting Fee – XYZ Ltd',   bankAmount: 75000,  ledgerAmount: null,   status: 'unmatched' },
  { id: 'r5', date: '2024-03-15', description: 'Employee Salaries',          bankAmount: 320000, ledgerAmount: 320000, status: 'matched'   },
  { id: 'r6', date: '2024-03-14', description: 'Vendor Advance – TechParts', bankAmount: 18000,  ledgerAmount: null,   status: 'unmatched' },
];

const STATUS_CONFIG = {
  matched:   { icon: CheckCircle, color: 'text-green-400', label: 'Matched',   badge: 'success' as const },
  partial:   { icon: AlertCircle, color: 'text-amber-400', label: 'Partial',   badge: 'warning' as const },
  unmatched: { icon: XCircle,     color: 'text-red-400',   label: 'Unmatched', badge: 'danger'  as const },
};

export function ReconciliationPanel() {
  const [filter, setFilter] = useState<'all' | RecItem['status']>('all');

  const visible = filter === 'all' ? ITEMS : ITEMS.filter((i) => i.status === filter);
  const matched   = ITEMS.filter((i) => i.status === 'matched').length;
  const partial   = ITEMS.filter((i) => i.status === 'partial').length;
  const unmatched = ITEMS.filter((i) => i.status === 'unmatched').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Reconciliation</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Bank vs Ledger matching</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <GitMerge className="w-4 h-4" />
          Auto-Match All
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Matched',   count: matched,   color: 'text-green-400', bg: 'bg-green-900/20 border-green-900/30' },
          { label: 'Partial',   count: partial,   color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-900/30' },
          { label: 'Unmatched', count: unmatched, color: 'text-red-400',   bg: 'bg-red-900/20 border-red-900/30'     },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={clsx('rounded-2xl border p-4', bg)}>
            <p className={clsx('text-3xl font-black', color)}>{count}</p>
            <p className="text-xs font-bold text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter + table */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-800">
          {(['all', 'matched', 'partial', 'unmatched'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all',
                filter === f
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Date', 'Description', 'Bank Amount', 'Ledger Amount', 'Difference', 'Status'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const cfg = STATUS_CONFIG[item.status];
              const Icon = cfg.icon;
              const diff = item.ledgerAmount !== null ? item.bankAmount - item.ledgerAmount : null;
              return (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{item.date}</td>
                  <td className="px-4 py-3 text-gray-100 font-bold">{item.description}</td>
                  <td className="px-4 py-3 text-gray-200 font-bold tabular-nums">₹{item.bankAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-gray-400 tabular-nums">
                    {item.ledgerAmount !== null ? `₹${item.ledgerAmount.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className={clsx('px-4 py-3 font-bold tabular-nums', diff === 0 ? 'text-green-400' : 'text-red-400')}>
                    {diff === null ? '—' : diff === 0 ? '₹0' : `₹${Math.abs(diff).toLocaleString('en-IN')}`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Icon className={clsx('w-3.5 h-3.5', cfg.color)} />
                      <Badge variant={cfg.badge}>{cfg.label}</Badge>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
