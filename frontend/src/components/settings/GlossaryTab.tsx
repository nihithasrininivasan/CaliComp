import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface Term { name: string; definition: string; example: string }

const TERMS: Term[] = [
  {
    name: 'Cash Runway',
    definition: 'How many days your business can keep operating before your bank balance hits zero, assuming current spending continues.',
    example: 'A runway of 42 days means you have 42 days of cash left at your current burn rate.',
  },
  {
    name: 'Burn Rate',
    definition: 'How much money your business spends on average each day or month.',
    example: 'If you spend ₹6,00,000 per month, your daily burn rate is ₹20,000.',
  },
  {
    name: 'Obligation',
    definition: 'A payment you are legally or contractually required to make.',
    example: 'Rent, vendor invoices, loan EMIs, and GST are all obligations.',
  },
  {
    name: 'Receivable',
    definition: 'Money owed to you by a client or customer that has not yet arrived in your bank account.',
    example: 'You raised an invoice for ₹1,50,000 to ABC Corp last week — that is a receivable until they pay.',
  },
  {
    name: 'Liquidity',
    definition: 'How easily your business can pay its bills right now using available cash.',
    example: 'High liquidity means you have enough cash on hand to cover all bills due this week.',
  },
  {
    name: 'GST',
    definition: 'Goods and Services Tax. A government tax on sales. You collect it from customers and pay it to the government monthly or quarterly.',
    example: 'You charged a client ₹1,00,000 + 18% GST = ₹1,18,000. You keep ₹1,00,000 and remit ₹18,000 to the government.',
  },
  {
    name: 'TDS',
    definition: 'Tax Deducted at Source. When you pay a vendor above a threshold, you must deduct a percentage and pay it to the government on their behalf.',
    example: 'You pay a consultant ₹50,000. At 10% TDS, you pay them ₹45,000 and deposit ₹5,000 to the Income Tax department.',
  },
  {
    name: 'Reconciliation',
    definition: 'Matching your bank statement debits and credits against your recorded invoices and obligations to confirm everything is accounted for.',
    example: 'Your bank shows a ₹45,000 debit on Mar 1 — reconciliation matches it to your Office Rent obligation.',
  },
  {
    name: 'LP Solver',
    definition: 'The mathematical engine CaliComp uses to decide which bills to pay first when cash is tight. It is deterministic — the same data always produces the same answer.',
    example: 'When you have ₹1,00,000 but owe ₹2,00,000, the LP Solver picks the payments that minimise total penalties.',
  },
  {
    name: 'Deferral',
    definition: 'Delaying a payment to a later date, usually after negotiation with the vendor.',
    example: 'You ask TechSupplies to move your invoice deadline from Mar 30 to Apr 6 — that is a 7-day deferral.',
  },
  {
    name: 'Flexibility Score',
    definition: "CaliComp's rating (0–100%) of how safely a payment can be deferred without major penalties or relationship damage.",
    example: 'TechSupplies has 70% flexibility — deferring them is relatively safe. HDFC EMI has 0% — do not defer.',
  },
  {
    name: 'Financial Health Score',
    definition: "CaliComp's composite score (0–100) measuring your business's overall financial stability across liquidity, obligations, revenue trend, and overdue risk.",
    example: 'A score of 68 means your finances are stable but there are 1–2 areas needing attention.',
  },
  {
    name: 'Confidence Band',
    definition: 'On the cash flow chart, the shaded area around the projection line that shows the range of possible outcomes based on uncertain future receivables.',
    example: 'A wide band at day 60 means your projected cash balance could vary by ±₹2,00,000 depending on when clients pay.',
  },
  {
    name: 'Account Aggregator',
    definition: "An RBI-regulated system that lets you share your bank data with apps like CaliComp securely, without sharing your banking password.",
    example: "You tap \"Allow\" on HDFC's AA consent screen — CaliComp receives 90 days of read-only transactions, no password involved.",
  },
];

export function GlossaryTab() {
  const [search, setSearch] = useState('');

  const filtered = TERMS.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-black text-white mb-1">Financial Glossary</h3>
        <p className="text-xs text-gray-500">Plain-English definitions for every term used in CaliComp, written for Indian SMB owners.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search terms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-8">No terms match "{search}"</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((term) => (
            <div key={term.name} className="p-5 bg-gray-900/40 border border-gray-800 rounded-xl">
              <p className="text-sm font-black text-white mb-2">{term.name}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{term.definition}</p>
              <div className="flex gap-2">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest shrink-0 mt-0.5">Example</span>
                <p className="text-[11px] text-gray-500 italic leading-relaxed">{term.example}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
