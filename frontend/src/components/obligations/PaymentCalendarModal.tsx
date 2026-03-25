// @BACKEND-PROMPT:
// Build GET /api/v1/calendar/ical/{business_id}
// Returns an iCal (.ics) formatted file with all PENDING obligations as events.
// Each event: SUMMARY = vendor_name + " — ₹" + amount, DTSTART = due_date,
// DESCRIPTION = "Priority: " + priority_score + " | Penalty: " + penalty_per_day + "/day"
// Set Content-Type: text/calendar in response headers.
// Also integrate with Cal.com API:
// POST /api/v1/calendar/sync — uses Cal.com API key from env to create events
// in the user's Cal.com account for all upcoming obligations.
// Cal.com API docs: https://cal.com/docs/api-reference

import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  X, ChevronLeft, ChevronRight, ExternalLink, Copy,
} from 'lucide-react';
import { Button } from '../ui/Common';
import { MOCK_OBLIGATIONS } from '../../services/mockData';
import { useToast } from '../../context/ToastContext';
import type { Obligation } from '../../types';

// ── helpers ───────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS   = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

/** Color class for a dot based on obligation priority / status. */
function dotColor(ob: Obligation): string {
  if (ob.status === 'overdue' || ob.priority === 'high') return 'bg-red-500';
  if (ob.priority === 'medium') return 'bg-amber-400';
  return 'bg-green-500';
}

/** yyyy-MM-dd for a Date. */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Build a lookup: dateStr → obligations due that day
function buildDayMap(obs: Obligation[]): Map<string, Obligation[]> {
  const map = new Map<string, Obligation[]>();
  for (const ob of obs) {
    const list = map.get(ob.dueDate) ?? [];
    list.push(ob);
    map.set(ob.dueDate, list);
  }
  return map;
}

// ── Day cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number;
  dateStr: string;
  isToday: boolean;
  obligations: Obligation[];
  activeDay: string | null;
  onToggle: (ds: string | null) => void;
}

function DayCell({ day, dateStr, isToday, obligations, activeDay, onToggle }: DayCellProps) {
  const hasObs = obligations.length > 0;
  const isActive = activeDay === dateStr;

  return (
    <div className="relative">
      <button
        onClick={() => hasObs ? onToggle(isActive ? null : dateStr) : undefined}
        className={clsx(
          'w-full aspect-square flex flex-col items-center justify-start pt-1 rounded-lg text-[11px] font-bold transition-colors relative',
          isToday && 'ring-1 ring-blue-500',
          hasObs ? 'cursor-pointer hover:bg-gray-800/60' : 'cursor-default',
          isActive && 'bg-gray-800/60',
        )}
      >
        <span className={clsx(
          isToday ? 'text-blue-400' : 'text-gray-400',
        )}>
          {day}
        </span>

        {/* dots row */}
        {hasObs && (
          <div className="flex items-center gap-0.5 mt-0.5 flex-wrap justify-center">
            {obligations.slice(0, 3).map(ob => (
              <span key={ob.id} className={clsx('w-1.5 h-1.5 rounded-full', dotColor(ob))} />
            ))}
            {obligations.length > 3 && (
              <span className="text-[8px] text-gray-500">+{obligations.length - 3}</span>
            )}
          </div>
        )}
      </button>

      {/* popover */}
      {isActive && hasObs && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-[#0D1220] border border-gray-700 rounded-xl shadow-2xl p-3 min-w-[180px] max-w-[220px]"
          style={{ pointerEvents: 'auto' }}
        >
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{dateStr}</p>
          <div className="space-y-2">
            {obligations.map(ob => (
              <div key={ob.id} className="flex items-start gap-2">
                <span className={clsx('w-1.5 h-1.5 rounded-full mt-1 shrink-0', dotColor(ob))} />
                <div>
                  <p className="text-[10px] font-bold text-gray-100 leading-tight">
                    {ob.vendorName ?? ob.description}
                  </p>
                  <p className="text-[9px] text-gray-500">₹{ob.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

interface PaymentCalendarModalProps {
  onClose: () => void;
}

export function PaymentCalendarModal({ onClose }: PaymentCalendarModalProps) {
  const { showToast } = useToast();

  // Use mock TODAY (2026-03-25) as reference so calendar matches mock data
  const mockToday = new Date('2026-03-25');
  const [viewDate, setViewDate] = useState(
    new Date(mockToday.getFullYear(), mockToday.getMonth(), 1),
  );
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Days in month, and what weekday the 1st falls on
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstWeekday  = new Date(year, month, 1).getDay();

  const dayMap = buildDayMap(MOCK_OBLIGATIONS);
  const todayStr = toDateStr(mockToday);

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
    setActiveDay(null);
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
    setActiveDay(null);
  }

  function copyIcal() {
    const url = 'https://calicomp.in/api/v1/calendar/ical/demo-business';
    navigator.clipboard.writeText(url).catch(() => {});
    showToast('iCal link copied. Paste into Google Calendar, Apple Calendar, or Outlook.', 'info');
  }

  // Legend counts
  const highCount = MOCK_OBLIGATIONS.filter(o => o.status === 'overdue' || o.priority === 'high').length;
  const medCount  = MOCK_OBLIGATIONS.filter(o => o.priority === 'medium' && o.status !== 'overdue').length;
  const lowCount  = MOCK_OBLIGATIONS.filter(o => o.priority === 'low').length;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#0D1220] border border-gray-800 rounded-2xl shadow-2xl">

          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-black text-white">Payment Calendar</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">All upcoming obligation due dates</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* ── Calendar ──────────────────────────────────────────────── */}
            <div>
              {/* month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-black text-white">
                  {MONTHS[month]} {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-[9px] font-black text-gray-600 uppercase tracking-wider py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* day grid — dismiss popover when clicking backdrop */}
              <div
                className="grid grid-cols-7 gap-0.5"
                onClick={(e) => {
                  // close popover if clicking grid background
                  if (e.target === e.currentTarget) setActiveDay(null);
                }}
              >
                {/* leading empty cells */}
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day    = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const obs    = dayMap.get(dateStr) ?? [];
                  return (
                    <DayCell
                      key={dateStr}
                      day={day}
                      dateStr={dateStr}
                      isToday={dateStr === todayStr}
                      obligations={obs}
                      activeDay={activeDay}
                      onToggle={setActiveDay}
                    />
                  );
                })}
              </div>

              {/* legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800/60">
                {[
                  { color: 'bg-red-500',   label: `High / Overdue (${highCount})` },
                  { color: 'bg-amber-400', label: `Medium (${medCount})` },
                  { color: 'bg-green-500', label: `Low (${lowCount})` },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={clsx('w-2 h-2 rounded-full', color)} />
                    <span className="text-[9px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sync banner ───────────────────────────────────────────── */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-3">
              <p className="text-xs font-bold text-gray-200">Sync to your external calendar →</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Your backend team is setting up automatic Cal.com sync. Once connected, all payment
                due dates will appear in your Cal.com calendar automatically.
              </p>
              <div className="flex gap-2 flex-wrap">
                <a
                  href="https://cal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900/20 border border-blue-900/40 text-blue-300 text-[10px] font-bold hover:bg-blue-900/30 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open in Cal.com
                </a>
                <button
                  onClick={copyIcal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-bold hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy iCal Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
