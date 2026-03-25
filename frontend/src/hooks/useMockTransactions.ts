import { useState, useMemo } from 'react';
import { useTransactionStore } from '../store/transactionStore';
import type { Transaction } from '../types';
import { subDays } from 'date-fns';

export function useMockTransactions(defaultDays: 30 | 60 | 90 = 30) {
  const { transactions } = useTransactionStore();
  const [days, setDays] = useState<30 | 60 | 90>(defaultDays);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const cutoff = subDays(new Date(), days);

  const filtered = useMemo<Transaction[]>(() => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      if (date < cutoff) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactions, days, search, typeFilter, cutoff]);

  const summary = useMemo(() => {
    const credits = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const debits = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { credits, debits, net: credits - debits, count: filtered.length };
  }, [filtered]);

  return { transactions: filtered, days, setDays, search, setSearch, typeFilter, setTypeFilter, summary };
}
