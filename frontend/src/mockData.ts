import { Transaction, Obligation, CashFlowPoint, AIRecommendation } from './types';
import { addDays, format } from 'date-fns';

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-03-20', description: 'Client Payment - ABC Corp', amount: 150000, type: 'income', status: 'reconciled', category: 'Sales' },
  { id: '2', date: '2024-03-19', description: 'Office Rent', amount: 45000, type: 'expense', status: 'reconciled', category: 'Rent' },
  { id: '3', date: '2024-03-18', description: 'AWS Cloud Services', amount: 12500, type: 'expense', status: 'pending', category: 'Infrastructure' },
  { id: '4', date: '2024-03-17', description: 'Consulting Fee - XYZ Ltd', amount: 75000, type: 'income', status: 'reconciled', category: 'Consulting' },
  { id: '5', date: '2024-03-15', description: 'Employee Salaries', amount: 320000, type: 'expense', status: 'reconciled', category: 'Payroll' },
  { id: '6', date: '2024-03-14', description: 'GST Q4 Payment', amount: 85000, type: 'expense', status: 'flagged', category: 'Tax' },
];

export const MOCK_OBLIGATIONS: Obligation[] = [
  { id: 'o1', dueDate: '2024-03-28', description: 'Vendor Payment - TechSupplies', amount: 45000, status: 'unpaid', type: 'vendor', priority: 'medium', flexibility: 0.7, penaltyRate: 0.02, relationshipTier: 'regular' },
  { id: 'o2', dueDate: '2024-03-25', description: 'GST Monthly Deposit', amount: 62000, status: 'overdue', type: 'gst', priority: 'high', flexibility: 0.1, penaltyRate: 0.18, relationshipTier: 'strategic' },
  { id: 'o3', dueDate: '2024-04-01', description: 'Office Rent - April', amount: 45000, status: 'unpaid', type: 'vendor', priority: 'high', flexibility: 0.3, penaltyRate: 0.05, relationshipTier: 'strategic' },
  { id: 'o4', dueDate: '2024-03-30', description: 'TDS Payment', amount: 12000, status: 'unpaid', type: 'tds', priority: 'high', flexibility: 0.1, penaltyRate: 0.15, relationshipTier: 'strategic' },
  { id: 'o5', dueDate: '2024-04-05', description: 'HDFC Business Loan EMI', amount: 85000, status: 'unpaid', type: 'emi', priority: 'high', flexibility: 0.0, penaltyRate: 0.24, relationshipTier: 'strategic' },
];

export const MOCK_CASH_FLOW: CashFlowPoint[] = Array.from({ length: 30 }).map((_, i) => {
  const date = addDays(new Date('2024-03-01'), i);
  const base = 500000 + Math.sin(i / 5) * 100000;
  return {
    date: format(date, 'MMM dd'),
    realistic: base,
    optimistic: base + (Math.random() * 50000),
    pessimistic: base - (Math.random() * 50000),
    actual: i < 25 ? base + (Math.random() * 20000 - 10000) : undefined,
  };
});

export const MOCK_RECOMMENDATIONS: AIRecommendation[] = [
  {
    id: 'r1',
    title: 'Defer TechSupplies Payment',
    description: 'TechSupplies is a regular vendor with high flexibility. Deferring by 7 days improves runway by 4 days.',
    impact: '+4 Days Runway',
    confidence: 'high',
    action: 'Generate Email',
  },
  {
    id: 'r2',
    title: 'Prioritize GST Deposit',
    description: 'GST payment is overdue. Immediate payment avoids 18% annual interest penalty.',
    impact: 'Save ₹1,200 Penalty',
    confidence: 'high',
    action: 'Pay Now',
  },
  {
    id: 'r3',
    title: 'Follow up with Client ABC',
    description: 'Client ABC has a history of 5-day delays. Early follow-up could secure ₹1.5L inflow sooner.',
    impact: 'Secure ₹1.5L Inflow',
    confidence: 'medium',
    action: 'Send Reminder',
  },
];
