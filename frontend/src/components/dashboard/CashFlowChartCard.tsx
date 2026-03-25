import React, { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { clsx } from 'clsx';
import { Card } from '../ui/Common';
import { getMockCashFlowData } from '../../services/mockData';

// @ML-PROMPT:
// Read CLAUDE.md. Build a cash flow forecasting model for CaliComp.
// This powers the Cash Flow Intelligence chart's optimistic/realistic/pessimistic bands.
// Implementation in backend/app/ml/cashflow_forecaster.py:
// 1. Features: historical daily cash balance, day of week, day of month, known upcoming obligations, known receivables, recurring transaction patterns.
// 2. Model: Facebook Prophet (pip install prophet) — ideal for financial time series with known future events (obligations) as regressors.
//    - Add obligations as negative future regressors (scheduled cash outflows)
//    - Add receivables as positive future regressors, weighted by confidence score
//    - Add recurring transactions as seasonality components
// 3. Output: for 30/60/90 day horizons, return {date, yhat (realistic), yhat_upper (optimistic), yhat_lower (pessimistic)} arrays — exactly matching the Recharts chart data format in src/services/mockData.ts getMockCashFlowData()
// 4. Expose as: GET /api/v1/ml/forecast?days=30|60|90 — the frontend chart should call this endpoint and replace getMockCashFlowData() with the real forecast.
// 5. Uncertainty bands widen naturally with Prophet as the horizon extends — this gives the correct visual behaviour where 90-day projections show wider bands than 30-day.
// Retrain Prophet model daily at midnight using APScheduler. Store model at backend/models/cashflow_prophet_{business_id}.pkl

const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}K`;

const DAYS = [30, 60, 90] as const;
type DayRange = typeof DAYS[number];

export function CashFlowChartCard() {
  const [days, setDays] = useState<DayRange>(30);

  // Re-compute data whenever toggle changes
  const data = useMemo(() => getMockCashFlowData(days), [days]);

  // Show every Nth tick to avoid crowding
  const tickInterval = days === 30 ? 4 : days === 60 ? 8 : 14;

  return (
    <Card
      title="Cash Flow Intelligence"
      subtitle="Confidence-based forecasting (Optimistic, Realistic, Pessimistic)"
      headerAction={
        <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'px-3 py-1 text-[10px] font-bold rounded-md transition-all',
                days === d
                  ? 'bg-gray-800 text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {d} Days
            </button>
          ))}
        </div>
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="opt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="real" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pess" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: '#6B7280', fontSize: 9, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 12, fontSize: 11 }}
              labelStyle={{ color: '#E5E7EB', fontWeight: 700 }}
              formatter={(value) => [fmt(Number(value))]}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              wrapperStyle={{ fontSize: 10, fontWeight: 700, paddingTop: 8 }}
            />
            <Area type="monotone" dataKey="optimistic"  stroke="#22C55E" strokeWidth={1.5} fill="url(#opt)"  dot={false} name="Optimistic"  />
            <Area type="monotone" dataKey="realistic"   stroke="#3B82F6" strokeWidth={2}   fill="url(#real)" dot={false} name="Realistic"   />
            <Area type="monotone" dataKey="pessimistic" stroke="#EF4444" strokeWidth={1.5} fill="url(#pess)" dot={false} name="Pessimistic" />
            <Area type="monotone" dataKey="actual"      stroke="#F59E0B" strokeWidth={2}   fill="none"        dot={false} name="Actual" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-gray-600 mt-3 text-center">
        Live data from database will replace demo data once backend connection is active.
        {days > 30 && ' Confidence bands widen with forecast horizon.'}
      </p>
    </Card>
  );
}
