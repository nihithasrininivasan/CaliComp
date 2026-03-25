export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'reconciled' | 'flagged' | 'partial';
  category: string;
  source?: 'manual' | 'ocr' | 'bank_feed' | 'csv';
  recurring?: boolean;
  frequency?: 'weekly' | 'monthly' | 'quarterly';
}

export interface Obligation {
  id: string;
  dueDate: string;
  description: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'deferred';
  type: 'vendor' | 'gst' | 'tds' | 'payroll' | 'emi' | 'utility' | 'other';
  priority: 'high' | 'medium' | 'low';
  flexibility: number; // 0 to 1
  penaltyRate: number;
  relationshipTier: 'strategic' | 'regular' | 'new';
  vendorName?: string;
  penaltyPerDay?: number;
  relationshipScore?: number; // 0–10
  priorityScore?: number;
  notes?: string;
}

export interface CashFlowPoint {
  date: string;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  actual?: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  confidence: 'high' | 'medium' | 'low';
  action: string;
}

export interface AIInsight {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  body: string;
  impact: string;
  actionLabel: string;
  actionRoute: string;
  category: 'DEFERRAL' | 'COLLECTION' | 'COMPLIANCE' | 'CASHFLOW';
}

export type NotificationType = 'OVERDUE' | 'UPCOMING' | 'AI_INSIGHT' | 'RECONCILIATION' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  actionLabel: string;
  actionRoute: string;
}

export interface ReconciliationMatch {
  id: string;
  matchId: string;
  bankDebit: {
    id: string;
    description: string;
    date: string;
    amount: number;
  };
  obligation: {
    id: string;
    description: string;
    date: string;
    amount: number;
  };
  confidence: number;
  matchReason: string;
  status: 'POTENTIAL' | 'CONFIRMED' | 'IGNORED';
}

export interface RecurringTemplate {
  id: string;
  description: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  nextDue: string;
  category: string;
  type: 'income' | 'expense';
}
