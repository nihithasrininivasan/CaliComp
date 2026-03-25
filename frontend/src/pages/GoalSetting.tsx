// @BACKEND-PROMPT:
// Build POST /api/v1/goals — save a goal assessment to the DB
// Build GET /api/v1/goals — return all saved goals for this business
// Goal schema: {id, business_id, name, investment_cost, self_financed,
//   loan_amount, interest_rate, tenure_months, emi_new, emi_available,
//   c_remaining, emi_ratio, liquidity_ratio, verdict, explanation, created_at}
// The computation logic is deterministic Python — mirror the TypeScript formulas
// exactly in backend/app/engine/goal_engine.py so results are consistent.
// Build GET /api/v1/goals/{id}/pdf — generates a PDF summary of the goal
// assessment using reportlab. Include the disclaimer text verbatim.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Common';
import { getMockTransactions, MOCK_OBLIGATIONS } from '../services/mockData';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';

// ── Formula helpers ───────────────────────────────────────────────────────────

export function computeEMI(L: number, annualRate: number, months: number): number {
  if (L <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return L / months;
  return (L * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GoalFormState {
  R:            number; // Monthly revenue
  E:            number; // Monthly expenses
  EMI_existing: number; // Existing EMI obligations
  C:            number; // Cash reserves
  name:         string; // Investment name
  I:            number; // Total investment cost
  S:            number; // Self-financed portion
  rate:         number; // Annual interest rate %
  tenure:       number; // Loan tenure months
}

export interface GoalResult {
  L:               number;
  EMI_new:         number;
  EMI_available:   number;
  C_remaining:     number;
  EMI_ratio:       number;
  liquidity_ratio: number;
  cashFlowFeasible: boolean;
  liquiditySafe:   boolean;
  verdict:         'FEASIBLE' | 'FEASIBLE_RISKY' | 'NOT_FEASIBLE';
  explanation:     string;
}

export interface SavedGoal {
  id:              string;
  name:            string;
  investment_cost: number;
  verdict:         GoalResult['verdict'];
  emi_new:         number;
  created_at:      string;
}

// ── Compute result ────────────────────────────────────────────────────────────

export function computeGoalResult(
  f: GoalFormState,
  overrideTenure?: number,
  overrideSelf?: number,
): GoalResult | null {
  const { R, E, EMI_existing, C, I, rate } = f;
  const S      = overrideSelf  ?? f.S;
  const tenure = overrideTenure ?? f.tenure;

  if (I <= 0 || S > I) return null;

  const L            = I - S;
  const EMI_new      = computeEMI(L, rate, tenure);
  const EMI_available = Math.max(0, R * 0.4 - EMI_existing);
  const C_remaining  = C - S;
  const EMI_ratio    = R > 0 ? ((EMI_existing + EMI_new) / R) * 100 : 0;
  const liquidity_ratio = E > 0 ? C_remaining / E : 0;

  const cashFlowFeasible = EMI_new <= EMI_available;
  const liquiditySafe    = C_remaining >= 3 * E;

  let verdict: GoalResult['verdict'];
  if (!cashFlowFeasible || EMI_ratio > 40) {
    verdict = 'NOT_FEASIBLE';
  } else if (!liquiditySafe || EMI_ratio >= 30) {
    verdict = 'FEASIBLE_RISKY';
  } else {
    verdict = 'FEASIBLE';
  }

  const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
  let explanation = '';
  if (verdict === 'FEASIBLE') {
    explanation =
      `This investment is feasible. Your new EMI of ${fmt(EMI_new)} is within your available ` +
      `capacity of ${fmt(EMI_available)}, and you will retain ${fmt(C_remaining)} in cash ` +
      `reserves — ${liquidity_ratio.toFixed(1)} months of expenses.`;
  } else if (verdict === 'FEASIBLE_RISKY') {
    explanation =
      `This investment is technically feasible, but ${EMI_ratio.toFixed(1)}% of your revenue ` +
      `will go toward EMIs after this commitment, which increases financial risk. Ensure your ` +
      `receivables are reliable before proceeding.`;
  } else {
    explanation =
      `This investment is not feasible at current cash flow levels. Your available EMI capacity ` +
      `is ${fmt(EMI_available)} but the required EMI is ${fmt(EMI_new)}. Consider a longer ` +
      `tenure, larger self-financed portion, or waiting until revenue improves.`;
  }

  return {
    L, EMI_new, EMI_available, C_remaining,
    EMI_ratio, liquidity_ratio, cashFlowFeasible, liquiditySafe,
    verdict, explanation,
  };
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub,
}: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
      {sub && <div>{sub}</div>}
    </div>
  );
}

// ── EMI stress progress bar ────────────────────────────────────────────────────

function StressBar({ ratio }: { ratio: number }) {
  const pct = Math.min(100, ratio);
  const color =
    ratio < 30 ? 'bg-green-500' :
    ratio < 40 ? 'bg-amber-400' : 'bg-red-500';
  const label =
    ratio < 30 ? 'text-green-400' :
    ratio < 40 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="space-y-1 mt-1">
      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <p className={clsx('text-[10px] font-black', label)}>{ratio.toFixed(1)}%</p>
    </div>
  );
}

// ── Verdict card ──────────────────────────────────────────────────────────────

function VerdictCard({ verdict, explanation }: { verdict: GoalResult['verdict']; explanation: string }) {
  const configs = {
    FEASIBLE:       { bg: 'bg-green-900/20', border: 'border-green-700/40', icon: '✓', iconColor: 'text-green-400', label: 'FEASIBLE',          labelColor: 'text-green-400' },
    FEASIBLE_RISKY: { bg: 'bg-amber-900/20', border: 'border-amber-700/40', icon: '⚠', iconColor: 'text-amber-400', label: 'FEASIBLE BUT RISKY', labelColor: 'text-amber-400' },
    NOT_FEASIBLE:   { bg: 'bg-red-900/20',   border: 'border-red-700/40',   icon: '✗', iconColor: 'text-red-400',   label: 'NOT FEASIBLE',       labelColor: 'text-red-400'   },
  };
  const c = configs[verdict];
  return (
    <div className={clsx('p-5 rounded-xl border', c.bg, c.border)}>
      <div className="flex items-center gap-3 mb-3">
        <span className={clsx('text-2xl font-black', c.iconColor)}>{c.icon}</span>
        <span className={clsx('text-base font-black tracking-wide', c.labelColor)}>{c.label}</span>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{explanation}</p>
    </div>
  );
}

// ── What-if slider ────────────────────────────────────────────────────────────

function WhatIfSlider({
  label, value, min, max, onChange, formatValue,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; formatValue: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400">{label}</p>
        <p className="text-xs font-black text-white">{formatValue(value)}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-[9px] text-gray-600">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function ResultsPanel({
  result, loading, sliderTenure, sliderSelf, onSliderTenure, onSliderSelf,
  maxInvestment, onSave, canSave, emergencyFundTarget,
}: {
  result: GoalResult | null; loading: boolean;
  sliderTenure: number; sliderSelf: number;
  onSliderTenure: (v: number) => void; onSliderSelf: (v: number) => void;
  maxInvestment: number; onSave: () => void; canSave: boolean;
  emergencyFundTarget: number;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Computing feasibility…</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-2">
        <p className="text-sm font-bold text-gray-500">Fill in the form to see your feasibility analysis.</p>
        <p className="text-[10px] text-gray-700">Results update automatically as you type.</p>
      </div>
    );
  }

  const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

  const liquidityColor =
    result.liquidity_ratio > 6 ? 'text-green-400' :
    result.liquidity_ratio >= 3 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-5">

      {/* ── Computed values 2×2 grid ──────────────────────────────── */}
      <div>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">
          Computed Values
        </p>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="New Monthly EMI"
            value={fmt(result.EMI_new)}
          />
          <MetricCard
            label="Available EMI Capacity"
            value={fmt(result.EMI_available)}
          />
          <MetricCard
            label="Remaining Cash Reserves"
            value={fmt(result.C_remaining)}
          />
          <MetricCard
            label="EMI Stress Ratio"
            value=""
            sub={<StressBar ratio={result.EMI_ratio} />}
          />
        </div>
      </div>

      {/* ── Feasibility conditions ────────────────────────────────── */}
      <div>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">
          Feasibility Conditions
        </p>
        <div className="space-y-2">
          {[
            {
              label: 'Cash Flow Feasibility: EMI_new ≤ EMI_available',
              pass: result.cashFlowFeasible,
              detail: result.cashFlowFeasible
                ? `${fmt(result.EMI_new)} ≤ ${fmt(result.EMI_available)}`
                : `${fmt(result.EMI_new)} exceeds capacity of ${fmt(result.EMI_available)}`,
            },
            {
              label: 'Liquidity Safety: Reserves ≥ 3× monthly expenses',
              pass: result.liquiditySafe,
              detail: result.liquiditySafe
                ? `${fmt(result.C_remaining)} remaining`
                : `${fmt(result.C_remaining)} is below the 3-month minimum`,
            },
          ].map(({ label, pass, detail }) => (
            <div
              key={label}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-xl border',
                pass ? 'bg-green-900/10 border-green-800/30' : 'bg-red-900/10 border-red-800/30',
              )}
            >
              {pass
                ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                : <XCircle    className="w-4 h-4 text-red-400   shrink-0 mt-0.5" />}
              <div>
                <p className="text-[10px] font-bold text-gray-200">{label}</p>
                <p className={clsx('text-[9px] mt-0.5', pass ? 'text-green-400' : 'text-red-400')}>
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emergency Fund warning (4D) ──────────────────────────── */}
      {result.C_remaining < emergencyFundTarget && (
        <div className="flex items-start gap-3 p-4 bg-amber-900/15 border border-amber-700/40 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-300">⚠️ Emergency Fund Warning</p>
            <p className="text-[10px] text-amber-200/80 mt-1 leading-relaxed">
              After this investment, your cash reserves (₹{Math.round(result.C_remaining).toLocaleString('en-IN')}) will
              fall below your emergency fund target (₹{emergencyFundTarget.toLocaleString('en-IN')}). This is not
              recommended regardless of the feasibility verdict.
            </p>
          </div>
        </div>
      )}

      {/* ── Verdict ───────────────────────────────────────────────── */}
      <VerdictCard
        verdict={result.C_remaining < emergencyFundTarget && result.verdict === 'FEASIBLE' ? 'FEASIBLE_RISKY' : result.verdict}
        explanation={
          result.C_remaining < emergencyFundTarget && result.verdict === 'FEASIBLE'
            ? 'Investment is mathematically feasible, but will deplete your emergency fund. Consult your financial advisor before proceeding.'
            : result.explanation
        }
      />

      {/* ── Liquidity ratio ───────────────────────────────────────── */}
      <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-800">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
          Liquidity After Investment
        </p>
        <p className={clsx('text-sm font-bold', liquidityColor)}>
          {result.liquidity_ratio > 0
            ? `You have ${result.liquidity_ratio.toFixed(1)} months of expenses in reserve after this investment.`
            : 'Insufficient cash reserves after this investment.'}
        </p>
      </div>

      {/* ── What-if sliders ───────────────────────────────────────── */}
      <div className="p-4 bg-gray-900/30 rounded-xl border border-gray-800 space-y-5">
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
          What-If Explorer
        </p>
        <WhatIfSlider
          label="Adjust Loan Tenure"
          value={sliderTenure}
          min={3} max={120}
          onChange={onSliderTenure}
          formatValue={v => `${v} months`}
        />
        {maxInvestment > 0 && (
          <WhatIfSlider
            label="Adjust Self-Financed Portion"
            value={sliderSelf}
            min={0} max={maxInvestment}
            onChange={onSliderSelf}
            formatValue={v => '₹' + v.toLocaleString('en-IN')}
          />
        )}
      </div>

      {/* ── Save goal ─────────────────────────────────────────────── */}
      <Button
        variant="primary"
        className="w-full py-3 text-sm font-black"
        disabled={!canSave}
        onClick={onSave}
      >
        Save Goal
      </Button>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  label, helper, children,
}: {
  label: string; helper?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
      {helper && <p className="text-[10px] text-gray-600 mt-1">{helper}</p>}
    </div>
  );
}

function NumberInput({
  value, onChange, min, max, prefix = '₹',
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value === 0 ? '' : value}
        min={min}
        max={max}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className={clsx(
          'w-full bg-gray-800 border border-gray-700 rounded-lg py-2 text-sm text-gray-200',
          'focus:outline-none focus:border-blue-600 transition-colors',
          prefix ? 'pl-7 pr-3' : 'px-3',
        )}
      />
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-700/40 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-black text-blue-400">{num}</span>
      </div>
      <p className="text-xs font-black text-gray-300 uppercase tracking-widest">{title}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GoalSetting() {
  // ── derive defaults from mock data ───────────────────────────────────────
  const mockTx = useMemo(() => getMockTransactions(30), []);
  const defaultR = useMemo(
    () => mockTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [mockTx],
  );
  const defaultE = useMemo(
    () => mockTx.filter(t => t.type === 'expense' && t.category !== 'Loan').reduce((s, t) => s + t.amount, 0),
    [mockTx],
  );
  const defaultEMI = useMemo(
    () => MOCK_OBLIGATIONS.filter(o => o.type === 'emi').reduce((s, o) => s + o.amount, 0),
    [],
  );
  const DEFAULT_CASH = 845000;

  // ── form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState<GoalFormState>({
    R:            defaultR,
    E:            defaultE,
    EMI_existing: defaultEMI,
    C:            DEFAULT_CASH,
    name:         '',
    I:            0,
    S:            0,
    rate:         12,
    tenure:       36,
  });

  function setField<K extends keyof GoalFormState>(key: K, value: GoalFormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  // ── derived ───────────────────────────────────────────────────────────────
  const L           = Math.max(0, form.I - form.S);
  const showLoan    = L > 0;
  const selfError   = form.S > form.I && form.I > 0;

  // ── debounced result ──────────────────────────────────────────────────
  const [debouncedForm, setDebouncedForm] = useState(form);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedForm(form), 300);
    return () => clearTimeout(t);
  }, [form]);

  const result = useMemo(
    () => computeGoalResult(debouncedForm),
    [debouncedForm],
  );

  // ── spinner state (500 ms UX effect on button click) ─────────────────
  const [loading, setLoading] = useState(false);
  const handleCalculate = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  // ── what-if sliders ────────────────────────────────────────────────────
  const [sliderTenure, setSliderTenure] = useState(form.tenure);
  const [sliderSelf,   setSliderSelf]   = useState(form.S);

  // keep sliders in sync when the base form values change
  useEffect(() => { setSliderTenure(form.tenure); }, [form.tenure]);
  useEffect(() => { setSliderSelf(form.S); },       [form.S]);

  // result that incorporates slider overrides (updates immediately)
  const sliderResult = useMemo(
    () => computeGoalResult(debouncedForm, sliderTenure, sliderSelf),
    [debouncedForm, sliderTenure, sliderSelf],
  );

  // ── saved goals store ──────────────────────────────────────────────────
  const [savedGoals, setSavedGoals] = useState<SavedGoal[]>([]);
  const { showToast } = useToast();
  const { emergencyFund } = useSettings();

  const canSave = !!(form.name.trim() && sliderResult && !loading);

  function handleSave() {
    if (!sliderResult || !form.name.trim()) return;
    const goal: SavedGoal = {
      id:              Math.random().toString(36).slice(2),
      name:            form.name.trim(),
      investment_cost: form.I,
      verdict:         sliderResult.verdict,
      emi_new:         sliderResult.EMI_new,
      created_at:      new Date().toLocaleDateString('en-IN'),
    };
    setSavedGoals(prev => [goal, ...prev]);
    showToast(`Goal '${goal.name}' saved.`, 'success');
  }

  function handleDeleteGoal(id: string) {
    setSavedGoals(prev => prev.filter(g => g.id !== id));
  }

  // ── recommended emergency fund range (used in helper text) ────────────
  const efLow  = Math.round(defaultE * 3);
  const efHigh = Math.round(defaultE * 6);
  const fmt    = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <div className="space-y-8">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Goal Setting &amp; Investment Feasibility
        </h2>
        <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">
          Model whether your business can afford a financial commitment
        </p>
      </div>

      {/* ── Persistent disclaimer banner ──────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-amber-900/10 border border-amber-700/40 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200/80 leading-relaxed">
          <span className="font-black text-amber-300">⚠️ Disclaimer: </span>
          This tool provides a mathematical model for your reference only. Always consult a qualified
          financial advisor before making any financial commitment. CaliComp's calculations do not
          constitute financial advice.
        </p>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

        {/* ══ LEFT — Input form ════════════════════════════════════════ */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 space-y-8">

          {/* Section 1 — Current Financials */}
          <div>
            <SectionHeader num={1} title="Your Current Financials" />
            <div className="space-y-4">
              <Field
                label="Monthly Revenue (R)"
                helper="Estimated average monthly income from all sources"
              >
                <NumberInput value={form.R} onChange={v => setField('R', v)} min={0} />
              </Field>

              <Field
                label="Monthly Expenses (E)"
                helper="Total operating costs per month, excluding existing EMIs"
              >
                <NumberInput value={form.E} onChange={v => setField('E', v)} min={0} />
              </Field>

              <Field
                label="Existing EMI Obligations"
                helper="Sum of all current loan EMIs you are already paying"
              >
                <NumberInput value={form.EMI_existing} onChange={v => setField('EMI_existing', v)} min={0} />
              </Field>

              <Field
                label="Cash Reserves (C)"
                helper={`Recommended emergency fund: ${fmt(efLow)} – ${fmt(efHigh)} (3–6 months of expenses)`}
              >
                <NumberInput value={form.C} onChange={v => setField('C', v)} min={0} />
              </Field>
            </div>
          </div>

          <div className="border-t border-gray-800" />

          {/* Section 2 — Investment Goal */}
          <div>
            <SectionHeader num={2} title="Your Investment Goal" />
            <div className="space-y-4">
              <Field label="Investment Name">
                <input
                  type="text"
                  placeholder='e.g. "New Delivery Van", "Office Expansion"'
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
                />
              </Field>

              <Field label="Total Investment Cost (I)">
                <NumberInput value={form.I} onChange={v => setField('I', v)} min={0} />
              </Field>

              <Field
                label="Self-Financed Portion (S)"
                helper="Amount you will pay from your own funds"
              >
                <NumberInput value={form.S} onChange={v => setField('S', v)} min={0} max={form.I} />
                {selfError && (
                  <p className="text-[10px] text-red-400 font-bold mt-1">
                    Self-financed portion cannot exceed total investment.
                  </p>
                )}
              </Field>

              {/* Loan required — read only */}
              <Field label="Loan Required (auto-computed)">
                <div className="w-full bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">₹</span>
                  <span className={clsx(
                    'text-sm font-black',
                    L > 0 ? 'text-white' : 'text-gray-600',
                  )}>
                    {L > 0 ? L.toLocaleString('en-IN') : '—'}
                  </span>
                  {L > 0 && (
                    <span className="ml-auto text-[9px] text-gray-600 font-bold uppercase">READ-ONLY</span>
                  )}
                </div>
              </Field>
            </div>
          </div>

          {/* Section 3 — Loan Parameters (only if L > 0) */}
          {showLoan && (
            <>
              <div className="border-t border-gray-800" />
              <div>
                <SectionHeader num={3} title="Loan Parameters" />
                <div className="space-y-4">
                  <Field label="Annual Interest Rate (%)" helper="Typical range: 10–18% for business loans">
                    <NumberInput
                      value={form.rate}
                      onChange={v => setField('rate', Math.min(36, Math.max(1, v)))}
                      min={1} max={36} prefix="%"
                    />
                  </Field>

                  <Field label="Loan Tenure (months)" helper="Longer tenure = lower EMI, more total interest">
                    <NumberInput
                      value={form.tenure}
                      onChange={v => setField('tenure', Math.min(120, Math.max(3, v)))}
                      min={3} max={120} prefix=""
                    />
                  </Field>
                </div>
              </div>
            </>
          )}

          {/* Calculate button */}
          <Button
            variant="primary"
            className="w-full py-3 text-sm font-black"
            disabled={!form.name.trim() || form.I <= 0 || selfError}
            onClick={handleCalculate}
          >
            Calculate Feasibility
          </Button>
        </div>

        {/* ══ RIGHT — Results panel ═══════════════════════════════════ */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-5">
            Feasibility Analysis
            {form.name.trim() && (
              <span className="ml-2 text-gray-400 normal-case font-bold">— {form.name}</span>
            )}
          </p>
          <ResultsPanel
            result={sliderResult}
            loading={loading}
            sliderTenure={sliderTenure}
            sliderSelf={sliderSelf}
            onSliderTenure={setSliderTenure}
            onSliderSelf={setSliderSelf}
            maxInvestment={form.I}
            onSave={handleSave}
            canSave={canSave}
            emergencyFundTarget={emergencyFund.target}
          />
        </div>
      </div>

      {/* ── Saved Goals table ──────────────────────────────────────────── */}
      {savedGoals.length > 0 && (
        <div className="bg-[#111827] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-sm font-bold text-gray-100">Saved Goals</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{savedGoals.length} goal{savedGoals.length !== 1 ? 's' : ''} saved this session</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Goal Name', 'Total Cost', 'Monthly EMI', 'Verdict', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {savedGoals.map(g => {
                  const verdictStyle =
                    g.verdict === 'FEASIBLE'       ? 'text-green-400' :
                    g.verdict === 'FEASIBLE_RISKY' ? 'text-amber-400' : 'text-red-400';
                  const verdictLabel =
                    g.verdict === 'FEASIBLE'       ? 'Feasible' :
                    g.verdict === 'FEASIBLE_RISKY' ? 'Risky'    : 'Not Feasible';
                  return (
                    <tr key={g.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-5 py-3 font-bold text-gray-100">{g.name}</td>
                      <td className="px-5 py-3 text-gray-300">₹{g.investment_cost.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-gray-300">₹{Math.round(g.emi_new).toLocaleString('en-IN')}</td>
                      <td className={clsx('px-5 py-3 font-black', verdictStyle)}>{verdictLabel}</td>
                      <td className="px-5 py-3 text-gray-500">{g.created_at}</td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
