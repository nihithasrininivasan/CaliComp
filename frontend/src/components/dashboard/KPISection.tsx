import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, Activity, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useSettings } from '../../context/SettingsContext';

interface KPI {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  accent: string;
}

const KPIS: KPI[] = [
  { label: 'Current Cash Balance',  value: '₹8,45,000',  change: '+12.4%', positive: true,  icon: DollarSign,    accent: 'text-green-400'  },
  { label: 'Cash Runway',           value: '42 Days',    change: '-3 days', positive: false, icon: Clock,         accent: 'text-amber-400'  },
  { label: 'Monthly Revenue',       value: '₹2,25,000',  change: '+8.1%',  positive: true,  icon: TrendingUp,    accent: 'text-blue-400'   },
  { label: 'Pending Obligations',   value: '₹2,04,000',  change: '+5 new', positive: false, icon: AlertTriangle,  accent: 'text-red-400'    },
  { label: 'Overdue Payments',      value: '₹62,000',    change: '1 item',  positive: false, icon: TrendingDown,  accent: 'text-red-500'    },
  { label: 'Net Cash Flow (MTD)',   value: '+₹21,000',   change: 'vs last mo.', positive: true, icon: Activity,  accent: 'text-green-400'  },
];

const CASH_BALANCE = 845000; // mirrors mock data

export function KPISection() {
  const { emergencyFund } = useSettings();
  const { target } = emergencyFund;
  const pct        = Math.min(100, Math.round((CASH_BALANCE / target) * 100));
  const buffer     = CASH_BALANCE - target;
  const belowTarget = CASH_BALANCE < target;

  const barColor =
    CASH_BALANCE > target * 1.2 ? 'bg-green-500' :
    CASH_BALANCE >= target       ? 'bg-amber-400' : 'bg-red-500';

  const accentColor =
    CASH_BALANCE > target * 1.2 ? 'text-green-400' :
    CASH_BALANCE >= target       ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
      {KPIS.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-tight">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
                <Icon className={clsx('w-3.5 h-3.5', kpi.accent)} />
              </div>
            </div>
            <p className="text-lg font-black text-white leading-none">{kpi.value}</p>
            <span className={clsx('text-[9px] font-bold', kpi.positive ? 'text-green-400' : 'text-red-400')}>
              {kpi.change}
            </span>
          </div>
        );
      })}

      {/* Emergency Fund card */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Emergency Fund</span>
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <ShieldCheck className={clsx('w-3.5 h-3.5', accentColor)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className={clsx('text-lg font-black leading-none', accentColor)}>
            {buffer >= 0 ? '+' : '−'}₹{Math.abs(buffer).toLocaleString('en-IN')}
          </p>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className={clsx('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {belowTarget ? (
          <span className="text-[9px] font-black text-red-400">⚠️ Below Target</span>
        ) : (
          <span className="text-[9px] font-bold text-gray-500">{pct}% of target</span>
        )}
      </div>
    </div>
  );
}
