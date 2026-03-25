// @BACKEND-PROMPT:
// Read CLAUDE.md. Build the notification generation service in backend/app/services/notifications.py
// This service is called by other parts of the backend to create notifications. Never call it from the frontend.
// Notification triggers to implement:
// 1. OVERDUE: Run daily at 8am IST via APScheduler. For every obligation where due_date < today AND status = PENDING: create notification {type: OVERDUE, title: "[Vendor] payment overdue", body: "₹[amount] to [vendor] was due [X] days ago. Penalty accruing at [rate]% p.a.", action_route: "/obligations"}
// 2. UPCOMING: Run daily at 8am. For obligations due within 3 days: create UPCOMING notification.
// 3. RECONCILIATION: When auto-match finds a new potential match with confidence >= 85%: create notification.
// 4. AI_INSIGHT: When insights cache is refreshed and a HIGH priority insight is generated.
// 5. SYSTEM: When a new bank connection is established or disconnected.
// Build GET /api/v1/notifications — returns all notifications for business, sorted by timestamp DESC, unread first.
// Build PATCH /api/v1/notifications/{id}/read and PATCH /api/v1/notifications/read-all
// Build GET /api/v1/notifications/unread-count — returns {count: int} — polled by frontend every 60 seconds.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Bell, AlertTriangle, Clock, BrainCircuit, GitMerge, Settings,
  CheckCheck, ChevronRight,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Button, Badge } from '../components/ui/Common';
import type { AppNotification, NotificationType } from '../types';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
  badgeVariant: 'danger' | 'warning' | 'info' | 'success' | 'default';
}> = {
  OVERDUE:        { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-900/20',    label: 'Overdue',        badgeVariant: 'danger'  },
  UPCOMING:       { icon: Clock,         color: 'text-amber-400',  bg: 'bg-amber-900/20',  label: 'Upcoming',       badgeVariant: 'warning' },
  AI_INSIGHT:     { icon: BrainCircuit,  color: 'text-blue-400',   bg: 'bg-blue-900/20',   label: 'AI Insight',     badgeVariant: 'info'    },
  RECONCILIATION: { icon: GitMerge,      color: 'text-purple-400', bg: 'bg-purple-900/20', label: 'Reconciliation', badgeVariant: 'default' },
  SYSTEM:         { icon: Settings,      color: 'text-gray-400',   bg: 'bg-gray-800',      label: 'System',         badgeVariant: 'default' },
};

type FilterType = 'all' | 'unread' | 'OVERDUE' | 'AI_INSIGHT';

function groupNotifications(notifications: AppNotification[]) {
  const today: AppNotification[] = [];
  const thisWeek: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  for (const n of notifications) {
    if (isToday(n.timestamp)) today.push(n);
    else if (isThisWeek(n.timestamp)) thisWeek.push(n);
    else earlier.push(n);
  }
  return { today, thisWeek, earlier };
}

function NotificationItem({ n, onAction, onRead }: {
  n: AppNotification;
  onAction: (n: AppNotification) => void;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[n.type];
  const Icon = cfg.icon;
  return (
    <div
      className={clsx(
        'flex items-start gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors cursor-pointer border-b border-gray-800/50 last:border-0',
        !n.read && 'bg-blue-900/5'
      )}
      onClick={() => onRead(n.id)}
    >
      {/* Icon */}
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
        <Icon className={clsx('w-4 h-4', cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={clsx('text-xs font-bold', n.read ? 'text-gray-300' : 'text-white')}>{n.title}</span>
          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{n.body}</p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-600">
            {formatDistanceToNow(n.timestamp, { addSuffix: true })}
          </span>
          <button
            className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); onAction(n); }}
          >
            {n.actionLabel}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="px-6 py-2 bg-gray-900/40 border-b border-gray-800">
      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
      <span className="ml-2 text-[9px] text-gray-600">({count})</span>
    </div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'OVERDUE') return n.type === 'OVERDUE';
    if (filter === 'AI_INSIGHT') return n.type === 'AI_INSIGHT';
    return true;
  });

  const { today, thisWeek, earlier } = groupNotifications(filtered);
  const unread = notifications.filter((n) => !n.read).length;

  function handleAction(n: AppNotification) {
    markRead(n.id);
    navigate(n.actionRoute);
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'unread',     label: `Unread (${unread})` },
    { key: 'OVERDUE',    label: 'Overdue' },
    { key: 'AI_INSIGHT', label: 'AI Insights' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Notifications</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" className="flex items-center gap-2" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all',
              filter === key
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell className="w-10 h-10 text-gray-700" />
            <p className="text-sm font-bold text-gray-500">No notifications</p>
          </div>
        ) : (
          <>
            <SectionHeader label="Today" count={today.length} />
            {today.map((n) => (
              <NotificationItem key={n.id} n={n} onAction={handleAction} onRead={markRead} />
            ))}
            <SectionHeader label="This Week" count={thisWeek.length} />
            {thisWeek.map((n) => (
              <NotificationItem key={n.id} n={n} onAction={handleAction} onRead={markRead} />
            ))}
            <SectionHeader label="Earlier" count={earlier.length} />
            {earlier.map((n) => (
              <NotificationItem key={n.id} n={n} onAction={handleAction} onRead={markRead} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
