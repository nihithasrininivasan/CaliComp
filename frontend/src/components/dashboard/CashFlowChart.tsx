import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MOCK_CASH_FLOW } from '../../mockData';

const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}K`;

export function CashFlowChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={MOCK_CASH_FLOW} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="optimistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="realistic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pessimistic" x1="0" y1="0" x2="0" y2="1">
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
            interval={4}
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
          <Area type="monotone" dataKey="optimistic"  stroke="#22C55E" strokeWidth={1.5} fill="url(#optimistic)"  dot={false} name="Optimistic"  />
          <Area type="monotone" dataKey="realistic"   stroke="#3B82F6" strokeWidth={2}   fill="url(#realistic)"   dot={false} name="Realistic"   />
          <Area type="monotone" dataKey="pessimistic" stroke="#EF4444" strokeWidth={1.5} fill="url(#pessimistic)" dot={false} name="Pessimistic" />
          <Area type="monotone" dataKey="actual"      stroke="#F59E0B" strokeWidth={2}   fill="none"              dot={false} name="Actual"      strokeDasharray="4 2" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
