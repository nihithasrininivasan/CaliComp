import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { AppNotification } from '../types';
import { useSettings } from './SettingsContext';

// TODO: replace with GET /api/v1/notifications (polling every 60s)

const ROTATING_ALERTS: Omit<AppNotification, 'id' | 'timestamp' | 'read'>[] = [
  {
    type: 'OVERDUE',
    title: 'GST payment is overdue',
    body: '₹62,000 GST Monthly Deposit was due 2 days ago. Penalty accruing at 18% p.a.',
    actionLabel: 'View Obligation',
    actionRoute: '/obligations',
  },
  {
    type: 'AI_INSIGHT',
    title: 'New AI insight available',
    body: 'Deferring TechSupplies payment by 7 days could extend your runway by 4 days.',
    actionLabel: 'View Insights',
    actionRoute: '/ai-insights',
  },
  {
    type: 'RECONCILIATION',
    title: 'Possible match found',
    body: '₹45,000 bank debit may match Office Rent obligation. 94% confidence.',
    actionLabel: 'Review Match',
    actionRoute: '/reconciliation',
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'OVERDUE',
    title: 'GST Monthly Deposit overdue',
    body: '₹62,000 to GST was due 2 days ago. Penalty accruing at 18% p.a.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    actionLabel: 'View Obligation',
    actionRoute: '/obligations',
  },
  {
    id: 'n2',
    type: 'UPCOMING',
    title: 'TDS Payment due in 2 days',
    body: '₹12,000 TDS payment is due on Mar 30. Penalty: 15% p.a. if missed.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: false,
    actionLabel: 'View Obligation',
    actionRoute: '/obligations',
  },
  {
    id: 'n3',
    type: 'AI_INSIGHT',
    title: 'Runway warning: 42 days',
    body: 'At current burn rate, cash runway hits zero in 42 days. Consider deferring TechSupplies.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: false,
    actionLabel: 'View Insights',
    actionRoute: '/ai-insights',
  },
  {
    id: 'n4',
    type: 'RECONCILIATION',
    title: 'Auto-match found 2 matches',
    body: 'CaliComp found potential matches for Office Rent and HDFC EMI. Review and confirm.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    actionLabel: 'Review Matches',
    actionRoute: '/reconciliation',
  },
  {
    id: 'n5',
    type: 'UPCOMING',
    title: 'HDFC Business Loan EMI due in 5 days',
    body: '₹85,000 EMI due Apr 5. Penalty rate: 24% p.a. Zero flexibility.',
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
    read: true,
    actionLabel: 'View Obligation',
    actionRoute: '/obligations',
  },
  {
    id: 'n6',
    type: 'SYSTEM',
    title: 'HDFC Bank connected successfully',
    body: 'Account Aggregator consent granted. Last 90 days of transactions imported.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    read: true,
    actionLabel: 'View Transactions',
    actionRoute: '/transactions',
  },
  {
    id: 'n7',
    type: 'AI_INSIGHT',
    title: 'Collect from Client ABC Corp',
    body: '₹1,50,000 receivable from ABC Corp is 5 days overdue. Early follow-up could improve runway by 6 days.',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    read: true,
    actionLabel: 'Generate Email',
    actionRoute: '/ai-insights',
  },
  {
    id: 'n8',
    type: 'RECONCILIATION',
    title: 'Unmatched bank debit flagged',
    body: '₹18,000 debit on Mar 14 labelled "Vendor Advance – TechParts" has no matching obligation.',
    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000),
    read: true,
    actionLabel: 'Review',
    actionRoute: '/reconciliation',
  },
];

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const CASH_BALANCE = 845000; // mirrors mock data

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const rotateIdx        = useRef(0);
  const firedWarning     = useRef(false);
  const firedCritical    = useRef(false);
  const { emergencyFund } = useSettings();

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Simulate backend push + emergency fund check every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Rotating demo alert
      const alert = ROTATING_ALERTS[rotateIdx.current % ROTATING_ALERTS.length];
      rotateIdx.current += 1;
      addNotification(alert);

      // Emergency fund checks (once per session each)
      const { target } = emergencyFund;
      if (!firedCritical.current && CASH_BALANCE < target * 0.5) {
        firedCritical.current = true;
        addNotification({
          type: 'SYSTEM',
          title: '🚨 Critical: Emergency Fund Severely Depleted',
          body: `Your cash balance is less than half your emergency fund target. Review your obligations immediately and consider deferring non-critical payments.`,
          actionLabel: 'View Obligations',
          actionRoute: '/obligations',
        });
      } else if (!firedWarning.current && CASH_BALANCE < target) {
        firedWarning.current = true;
        addNotification({
          type: 'SYSTEM',
          title: '⚠️ Emergency Fund Alert',
          body: `Your cash balance (₹${CASH_BALANCE.toLocaleString('en-IN')}) has dropped below your emergency fund target (₹${target.toLocaleString('en-IN')}). Avoid discretionary spending until resolved.`,
          actionLabel: 'View Settings',
          actionRoute: '/settings',
        });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [addNotification, emergencyFund]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
