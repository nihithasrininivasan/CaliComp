import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { Badge, Button } from '../ui/Common';
import { useMockTransactions } from '../../hooks/useMockTransactions';
import { ManualEntryForm } from './ManualEntryForm';
import type { Transaction } from '../../types';

const STATUS_VARIANT: Record<Transaction['status'], 'success' | 'warning' | 'danger' | 'default'> = {
  reconciled: 'success',
  pending:    'warning',
  flagged:    'danger',
  partial:    'warning',
};

const TYPE_COLOR: Record<Transaction['type'], string> = {
  income:  'text-green-400',
  expense: 'text-red-400',
};

const DAY_OPTIONS = [30, 60, 90] as const;

interface TransactionTableProps {
  defaultDays?: 30 | 60 | 90;
}

export function TransactionTable({ defaultDays = 30 }: TransactionTableProps) {
  const { transactions, days, setDays, search, setSearch, typeFilter, setTypeFilter, summary } =
    useMockTransactions(defaultDays);

  const [slideOverOpen, setSlideOverOpen] = useState(false);

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-3 divide-x divide-gray-800 border-b border-gray-800">
        {[
          { label: 'Total Credits', value: `+₹${summary.credits.toLocaleString('en-IN')}`, color: 'text-green-400' },
          { label: 'Total Debits',  value: `-₹${summary.debits.toLocaleString('en-IN')}`,  color: 'text-red-400'   },
          { label: 'Net Cash Flow', value: `${summary.net >= 0 ? '+' : ''}₹${summary.net.toLocaleString('en-IN')}`, color: summary.net >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-6 py-4 text-center">
            <p className={clsx('text-lg font-black', color)}>{value}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={clsx(
                'px-3 py-1 rounded-lg text-[10px] font-bold capitalize transition-all',
                typeFilter === f ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Day range */}
        <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'px-3 py-1 rounded-lg text-[10px] font-bold transition-all',
                days === d ? 'bg-gray-800 text-gray-100' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {d}d
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold ml-auto">
          <Filter className="w-3 h-3" />
          {transactions.length} results
        </div>

        <Button variant="outline" className="text-xs flex items-center gap-1.5" onClick={() => setSlideOverOpen(true)}>
          + Manual Entry
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Date', 'Description', 'Category', 'Amount', 'Status', 'Source'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                <td className="px-4 py-3 text-gray-400 font-medium">{t.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 font-bold">{t.description}</span>
                    {t.recurring && (
                      <RefreshCw className="w-3 h-3 text-blue-400 shrink-0" aria-label="Recurring" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-[10px] font-bold">{t.category}</span>
                </td>
                <td className={clsx('px-4 py-3 font-black tabular-nums', TYPE_COLOR[t.type])}>
                  {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-600 text-[10px] uppercase font-bold">{t.source ?? 'manual'}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-600 font-bold">
                  No transactions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Entry slide-over */}
      {slideOverOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSlideOverOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0D1220] border-l border-gray-800 z-50 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 shrink-0">
              <h3 className="text-sm font-black text-white">Manual Entry</h3>
              <button onClick={() => setSlideOverOpen(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <ManualEntryForm onSuccess={() => setSlideOverOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
