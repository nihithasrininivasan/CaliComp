import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Transaction, RecurringTemplate } from '../types';
import { getMockTransactions } from '../services/mockData';

interface TransactionStoreValue {
  transactions: Transaction[];
  recurringTemplates: RecurringTemplate[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  addRecurringTemplate: (t: Omit<RecurringTemplate, 'id'>) => void;
  bankConnected: boolean;
  setBankConnected: (v: boolean) => void;
}

const TransactionStoreContext = createContext<TransactionStoreValue | null>(null);

export function TransactionStoreProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(getMockTransactions(90));
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  const [bankConnected, setBankConnected] = useState(false);

  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newT: Transaction = { ...t, id: `t-${Date.now()}` };
    setTransactions((prev) => [newT, ...prev]);
  }, []);

  const updateTransactionStatus = useCallback((id: string, status: Transaction['status']) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }, []);

  const addRecurringTemplate = useCallback((t: Omit<RecurringTemplate, 'id'>) => {
    const newT: RecurringTemplate = { ...t, id: `rt-${Date.now()}` };
    setRecurringTemplates((prev) => [newT, ...prev]);
  }, []);

  return (
    <TransactionStoreContext.Provider
      value={{
        transactions,
        recurringTemplates,
        addTransaction,
        updateTransactionStatus,
        addRecurringTemplate,
        bankConnected,
        setBankConnected,
      }}
    >
      {children}
    </TransactionStoreContext.Provider>
  );
}

export function useTransactionStore() {
  const ctx = useContext(TransactionStoreContext);
  if (!ctx) throw new Error('useTransactionStore must be used within TransactionStoreProvider');
  return ctx;
}
