import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Common';
import { useTransactionStore } from '../../store/transactionStore';
import { useToast } from '../../context/ToastContext';
import { format } from 'date-fns';

const CATEGORIES = ['Sales', 'Rent', 'Salary', 'Supplier', 'Tax', 'Infrastructure', 'Consulting', 'Loan', 'Utility', 'Other'] as const;
const FREQUENCIES = ['weekly', 'monthly', 'quarterly'] as const;

interface ManualEntryFormProps {
  prefill?: {
    vendor?: string;
    amount?: number;
    date?: string;
    type?: 'income' | 'expense';
    category?: string;
  };
  onSuccess?: () => void;
}

export function ManualEntryForm({ prefill, onSuccess }: ManualEntryFormProps) {
  const { addTransaction, addRecurringTemplate } = useTransactionStore();
  const { showToast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  const [date,        setDate]        = useState(prefill?.date     ?? today);
  const [description, setDescription] = useState(prefill?.vendor   ?? '');
  const [category,    setCategory]    = useState(prefill?.category ?? 'Other');
  const [amount,      setAmount]      = useState(prefill?.amount ? String(prefill.amount) : '');
  const [type,        setType]        = useState<'income' | 'expense'>(prefill?.type ?? 'expense');
  const [notes,       setNotes]       = useState('');
  const [recurring,   setRecurring]   = useState(false);
  const [frequency,   setFrequency]   = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [nextDue,     setNextDue]     = useState(today);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    addTransaction({
      date,
      description: description.trim(),
      amount: parsedAmount,
      type,
      status: 'pending',
      category,
      source: 'manual',
      recurring,
      frequency: recurring ? frequency : undefined,
    });

    if (recurring) {
      addRecurringTemplate({
        description: description.trim(),
        amount: parsedAmount,
        frequency,
        nextDue,
        category,
        type,
      });
    }

    showToast('Transaction saved successfully.');
    onSuccess?.();
  }

  const inputCls = 'w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors';
  const labelCls = 'block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Type *</label>
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
                  type === t
                    ? t === 'expense' ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-green-900/30 text-green-300 border border-green-800'
                    : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Description *</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Office Rent – April"
          className={inputCls}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Amount (₹) *</label>
          <input
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="45000"
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Any additional context…"
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Recurring toggle */}
      <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-300">Set as Recurring</span>
          </div>
          <button
            type="button"
            onClick={() => setRecurring(v => !v)}
            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${recurring ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${recurring ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
        {recurring && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className={labelCls}>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as typeof frequency)} className={inputCls}>
                {FREQUENCIES.map(f => <option key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Next Due</label>
              <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full py-3 text-sm">
        Save Transaction
      </Button>
    </form>
  );
}
