import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { HEALTH_COMPONENTS, computeHealthScore } from '../../services/mockData';

const SCORE = computeHealthScore();
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const OFFSET = CIRCUMFERENCE - (SCORE / 100) * CIRCUMFERENCE;

const SUB_SCORES = [
  { label: 'Liquidity',    value: HEALTH_COMPONENTS.liquidity.score,    color: '#3B82F6' },
  { label: 'Obligations',  value: HEALTH_COMPONENTS.obligations.score,  color: '#F59E0B' },
  { label: 'Revenue Trend',value: HEALTH_COMPONENTS.revenue.score,      color: '#22C55E' },
  { label: 'Risk',         value: HEALTH_COMPONENTS.risk.score,         color: '#8B5CF6' },
];

const COMPONENTS = [
  {
    label: 'Liquidity Score',
    weight: 30,
    score: HEALTH_COMPONENTS.liquidity.score,
    color: '#3B82F6',
    detail: HEALTH_COMPONENTS.liquidity.detail,
    rules: '>60 days = 100 · 30–60 days = 70 · 14–30 days = 40 · <14 days = 10',
  },
  {
    label: 'Obligations Score',
    weight: 25,
    score: HEALTH_COMPONENTS.obligations.score,
    color: '#F59E0B',
    detail: HEALTH_COMPONENTS.obligations.detail,
    rules: '0 overdue = 100 · each overdue obligation penalised proportionally',
  },
  {
    label: 'Revenue Trend',
    weight: 25,
    score: HEALTH_COMPONENTS.revenue.score,
    color: '#22C55E',
    detail: HEALTH_COMPONENTS.revenue.detail,
    rules: 'Positive MoM growth scores higher · negative trend = lower score',
  },
  {
    label: 'Risk Score',
    weight: 20,
    score: HEALTH_COMPONENTS.risk.score,
    color: '#8B5CF6',
    detail: HEALTH_COMPONENTS.risk.detail,
    rules: '0 HIGH-risk obligations = 100 · proportionally reduced per HIGH obligation',
  },
];

export function HealthScore() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        {/* Circular gauge */}
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#1F2937" strokeWidth="10" />
            <circle
              cx="70" cy="70" r={RADIUS}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="10"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={OFFSET}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white">{SCORE}</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Score</span>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="w-full space-y-2.5">
          {SUB_SCORES.map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400">{label}</span>
                <span className="text-[10px] font-black text-gray-200">{value}</span>
              </div>
              <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${value}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* How calculated link */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Info className="w-3 h-3" />
          How is this calculated?
        </button>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Financial Health Score — How It Works"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-xs text-gray-400 leading-relaxed">
            Your Financial Health Score is a composite of four components, each weighted to reflect their importance to your business's stability.
          </p>

          <div className="space-y-5">
            {COMPONENTS.map(({ label, weight, score, color, detail, rules }) => (
              <div key={label} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Weight: {weight}% of total score</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{score}</p>
                    <p className="text-[9px] text-gray-500">/ 100</p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, backgroundColor: color }}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-gray-300 font-bold">{detail}</p>
                  <p className="text-[10px] text-gray-600">{rules}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl">
            <p className="text-xs font-bold text-blue-300 mb-1">Composite Score Formula</p>
            <p className="text-[10px] text-gray-400 font-mono">
              Score = (Liquidity × 0.30) + (Obligations × 0.25) + (Revenue × 0.25) + (Risk × 0.20)
            </p>
            <p className="text-[10px] text-gray-400 font-mono mt-1">
              = ({HEALTH_COMPONENTS.liquidity.score} × 0.30) + ({HEALTH_COMPONENTS.obligations.score} × 0.25) + ({HEALTH_COMPONENTS.revenue.score} × 0.25) + ({HEALTH_COMPONENTS.risk.score} × 0.20) = <strong className="text-white">{SCORE}</strong>
            </p>
          </div>

          <button
            onClick={() => setModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-gray-800 text-xs font-bold text-gray-200 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
