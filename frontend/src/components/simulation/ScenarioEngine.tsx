// @BACKEND-PROMPT:
// Read CLAUDE.md. Build POST /api/v1/simulation/run in backend/app/routers/simulation.py
// Accepts: { defer_overrides: [{obligation_id, defer_days}], extra_monthly_revenue: number, expense_cut_pct: number }
// Step 1: Load current cash balance from the last bank statement balance for this business.
// Step 2: Load all unpaid/overdue obligations from DB. Apply defer_overrides to shift due dates.
// Step 3: Compute daily net cash flow: (avg_daily_income * (1 + extra_monthly_revenue/monthly_income)) - (avg_daily_expense * (1 - expense_cut_pct/100))
// Step 4: Walk forward 90 days. On each obligation due date, subtract amount. Accumulate daily balances.
// Step 5: Runway = first day balance < 0 (or 90 if never). Penalty cost = sum(penaltyPerDay * defer_days) for deferred obligations.
// Step 6: Return: { daily_balances: [{date, balance}], runway_days: number, penalty_cost: number, baseline_runway: number }

import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { AlertTriangle, TrendingUp, Clock, IndianRupee } from 'lucide-react';
import { Card, Button } from '../ui/Common';
import { MOCK_OBLIGATIONS } from '../../services/mockData';
import { ProGate } from '../ui/ProGate';

// ── Constants ─────────────────────────────────────────────────────────────────
const STARTING_BALANCE   = 845_000;
const AVG_DAILY_INCOME   = 16_667;   // ~₹5L/month
const AVG_DAILY_EXPENSE  = 5_000;    // base burn excluding obligations
const WEEKLY_BUCKETS     = 13;       // 13 weeks = ~90 days
const DANGER_THRESHOLD   = 200_000;  // balance below which we warn

// ── Runway engine ─────────────────────────────────────────────────────────────
interface SimInputs {
  deferDays:       Record<string, number>;   // obligationId → days deferred
  extraRevenue:    number;                   // additional monthly ₹
  expenseCutPct:   number;                   // 0–30 %
}

interface WeeklyBar {
  label:   string;
  balance: number;
  week:    number;
}

interface SimResult {
  weeklyBars:    WeeklyBar[];
  runwayDays:    number;
  penaltyCost:   number;
  totalDeferred: number;
}

function runSimulation(inputs: SimInputs): SimResult {
  const { deferDays, extraRevenue, expenseCutPct } = inputs;

  const dailyIncome  = AVG_DAILY_INCOME + extraRevenue / 30;
  const dailyExpense = AVG_DAILY_EXPENSE * (1 - expenseCutPct / 100);
  const dailyNet     = dailyIncome - dailyExpense;

  // Build obligation outflows by day (day 0 = today)
  const outflows: Record<number, number> = {};
  let penaltyCost   = 0;
  let totalDeferred = 0;

  const today = new Date('2026-03-25');

  for (const ob of MOCK_OBLIGATIONS) {
    if (ob.status === 'paid') continue;
    const due    = new Date(ob.dueDate);
    const baseDayOffset = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    const defer  = deferDays[ob.id] ?? 0;
    const dayIdx = Math.max(0, baseDayOffset + defer);

    outflows[dayIdx] = (outflows[dayIdx] ?? 0) + ob.amount;

    if (defer > 0) {
      penaltyCost   += (ob.penaltyPerDay ?? 0) * defer;
      totalDeferred += ob.amount;
    }
  }

  // Walk 90 days
  let balance    = STARTING_BALANCE;
  let runwayDays = 90;
  const daily: number[] = [];

  for (let d = 0; d < 90; d++) {
    balance += dailyNet;
    balance -= outflows[d] ?? 0;
    if (balance < 0 && runwayDays === 90) runwayDays = d;
    daily.push(Math.max(0, balance));
  }

  // Bucket into 13 weekly bars
  const weeklyBars: WeeklyBar[] = Array.from({ length: WEEKLY_BUCKETS }, (_, w) => {
    const endDay  = Math.min((w + 1) * 7 - 1, 89);
    return {
      label:   `W${w + 1}`,
      balance: Math.round(daily[endDay]),
      week:    w + 1,
    };
  });

  return { weeklyBars, runwayDays, penaltyCost, totalDeferred };
}

// ── Baseline (no deferrals) ───────────────────────────────────────────────────
const BASELINE = runSimulation({ deferDays: {}, extraRevenue: 0, expenseCutPct: 0 });

// ── Slider helper ─────────────────────────────────────────────────────────────
interface SliderProps {
  label:    string;
  value:    number;
  onChange: (v: number) => void;
  min:      number;
  max:      number;
  step?:    number;
  unit:     string;
  color:    string;
  disabled?: boolean;
}

function Slider({ label, value, onChange, min, max, step = 1, unit, color, disabled }: SliderProps) {
  return (
    <div className={clsx(disabled && 'opacity-40')}>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-300">{label}</span>
        <span className="text-xs font-black" style={{ color }}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-gray-600">{min}{unit}</span>
        <span className="text-[9px] text-gray-600">{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Obligation defer row ──────────────────────────────────────────────────────
interface DeferRowProps {
  ob:       typeof MOCK_OBLIGATIONS[0];
  days:     number;
  onChange: (id: string, v: number) => void;
}

const TYPE_LABEL: Record<string, string> = {
  gst: 'GST', tds: 'TDS', emi: 'EMI', vendor: 'Vendor',
  payroll: 'Payroll', utility: 'Utility', other: 'Other',
};

function DeferRow({ ob, days, onChange }: DeferRowProps) {
  const canDefer  = ob.flexibility > 0;
  const maxDefer  = Math.round(ob.flexibility * 30);
  const penalty   = (ob.penaltyPerDay ?? 0) * days;
  const isDeferred = days > 0;

  return (
    <div className={clsx(
      'p-3 rounded-xl border transition-colors',
      isDeferred ? 'border-amber-900/50 bg-amber-900/5' : 'border-gray-800 bg-gray-900/30'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-200 truncate">{ob.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-black text-gray-600 uppercase">{TYPE_LABEL[ob.type]}</span>
            <span className="text-[10px] text-gray-500">Due {ob.dueDate}</span>
          </div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-sm font-black text-red-400">₹{ob.amount.toLocaleString('en-IN')}</p>
          {isDeferred && penalty > 0 && (
            <p className="text-[9px] text-amber-400 font-bold mt-0.5">+₹{penalty} penalty</p>
          )}
        </div>
      </div>

      {canDefer ? (
        <Slider
          label={`Defer by`}
          value={days}
          onChange={v => onChange(ob.id, v)}
          min={0}
          max={maxDefer}
          unit=" days"
          color={isDeferred ? '#F59E0B' : '#6B7280'}
        />
      ) : (
        <p className="text-[10px] text-gray-600 font-bold">
          Not deferrable — {ob.type === 'gst' || ob.type === 'tds' ? 'statutory deadline' : 'no flexibility'}
        </p>
      )}
    </div>
  );
}

// ── Custom bar tooltip ─────────────────────────────────────────────────────────
function RunwayTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 font-bold">{label}</p>
      <p className={clsx('font-black mt-0.5', val < DANGER_THRESHOLD ? 'text-red-400' : 'text-green-400')}>
        ₹{val.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ScenarioEngine() {
  const [deferDays,     setDeferDays]     = useState<Record<string, number>>({});
  const [extraRevenue,  setExtraRevenue]  = useState(0);
  const [expenseCutPct, setExpenseCutPct] = useState(0);

  const result = useMemo(
    () => runSimulation({ deferDays, extraRevenue, expenseCutPct }),
    [deferDays, extraRevenue, expenseCutPct]
  );

  const runwayGain = result.runwayDays - BASELINE.runwayDays;

  function handleReset() {
    setDeferDays({});
    setExtraRevenue(0);
    setExpenseCutPct(0);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Scenario Engine</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">
            What-if cash flow modelling
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} className="text-xs">
          Reset All
        </Button>
      </div>

      <ProGate featureName="Scenario Engine">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left panel: controls ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Revenue & expense levers */}
            <Card title="Global Levers" subtitle="Adjust income and costs">
              <div className="space-y-5">
                <Slider
                  label="Extra Monthly Revenue"
                  value={extraRevenue / 1000}
                  onChange={v => setExtraRevenue(v * 1000)}
                  min={0} max={500} step={50}
                  unit="K"
                  color="#22C55E"
                />
                <Slider
                  label="Expense Reduction"
                  value={expenseCutPct}
                  onChange={setExpenseCutPct}
                  min={0} max={30}
                  unit="%"
                  color="#3B82F6"
                />
              </div>
            </Card>

            {/* Per-obligation deferrals */}
            <Card title="Obligation Deferrals" subtitle="Slide to defer payment — penalty cost shown">
              <div className="space-y-3">
                {MOCK_OBLIGATIONS.filter(o => o.status !== 'paid').map(ob => (
                  <DeferRow
                    key={ob.id}
                    ob={ob}
                    days={deferDays[ob.id] ?? 0}
                    onChange={(id, v) => setDeferDays(prev => ({ ...prev, [id]: v }))}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right panel: results ─────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* KPI strip */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Clock,
                  label: 'Cash Runway',
                  value: result.runwayDays === 90 ? '90+ days' : `${result.runwayDays} days`,
                  sub:   runwayGain > 0 ? `+${runwayGain}d vs baseline` : runwayGain < 0 ? `${runwayGain}d vs baseline` : 'Baseline',
                  color: result.runwayDays >= 60 ? 'text-green-400' : result.runwayDays >= 30 ? 'text-amber-400' : 'text-red-400',
                },
                {
                  icon: IndianRupee,
                  label: 'Penalty Cost',
                  value: result.penaltyCost > 0 ? `₹${result.penaltyCost.toLocaleString('en-IN')}` : '₹0',
                  sub:   result.totalDeferred > 0 ? `₹${result.totalDeferred.toLocaleString('en-IN')} deferred` : 'No deferrals',
                  color: result.penaltyCost > 0 ? 'text-amber-400' : 'text-green-400',
                },
                {
                  icon: TrendingUp,
                  label: 'Week 13 Balance',
                  value: `₹${(result.weeklyBars[12]?.balance ?? 0).toLocaleString('en-IN')}`,
                  sub:   'End of 90-day window',
                  color: (result.weeklyBars[12]?.balance ?? 0) > DANGER_THRESHOLD ? 'text-green-400' : 'text-red-400',
                },
                {
                  icon: AlertTriangle,
                  label: 'Starting Balance',
                  value: `₹${STARTING_BALANCE.toLocaleString('en-IN')}`,
                  sub:   'Current cash position',
                  color: 'text-gray-300',
                },
              ].map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className="bg-[#111827] border border-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
                  </div>
                  <p className={clsx('text-xl font-black', color)}>{value}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Runway bar chart */}
            <Card title="90-Day Runway Projection" subtitle="Weekly cash balance · Red line = danger threshold">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.weeklyBars} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                      tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                    />
                    <Tooltip content={<RunwayTooltip />} />
                    <ReferenceLine
                      y={DANGER_THRESHOLD}
                      stroke="#EF4444"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{ value: 'Danger', fill: '#EF4444', fontSize: 9, fontWeight: 700, position: 'insideTopRight' }}
                    />
                    <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                      {result.weeklyBars.map((entry) => (
                        <Cell
                          key={entry.week}
                          fill={entry.balance < DANGER_THRESHOLD ? '#EF4444' : entry.balance < DANGER_THRESHOLD * 2 ? '#F59E0B' : '#3B82F6'}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Assumption footnote */}
            <p className="text-[10px] text-gray-700 text-center">
              Assumes ₹{AVG_DAILY_INCOME.toLocaleString('en-IN')}/day avg income · ₹{AVG_DAILY_EXPENSE.toLocaleString('en-IN')}/day base expenses · obligations from live data
              {' '}·{' '}
              <span className="text-gray-600">TODO: replace with GET /api/v1/simulation/run</span>
            </p>
          </div>
        </div>
      </ProGate>
    </div>
  );
}
