import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KPISection } from '../components/dashboard/KPISection';
import { HealthScore } from '../components/dashboard/HealthScore';
import { Card, Button } from '../components/ui/Common';
import { Plus, TrendingUp, Zap } from 'lucide-react';
import { CashFlowChartCard } from '../components/dashboard/CashFlowChartCard';
import { RiskHeatmapCard } from '../components/dashboard/RiskHeatmapCard';
import { AIInsightsCard } from '../components/dashboard/AIInsightsCard';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Financial Overview</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Real-time Intelligence Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate('/transactions?range=90')}>
            <TrendingUp className="w-4 h-4" />
            Historical Data
          </Button>
          <Button variant="primary" className="flex items-center gap-2 px-6" onClick={() => navigate('/add-transaction')}>
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <KPISection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <CashFlowChartCard />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RiskHeatmapCard />

            <Card title="Relationship Intelligence" subtitle="Vendor categorization">
              <div className="space-y-4">
                {[
                  { label: 'Strategic Partners', count: 4, pct: '40%', color: 'bg-blue-500' },
                  { label: 'Regular Vendors',    count: 12, pct: '60%', color: 'bg-amber-500' },
                  { label: 'New / One-time',     count: 8,  pct: '25%', color: 'bg-gray-700' },
                ].map(({ label, count, pct, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 font-medium">{label}</span>
                      <span className="text-xs font-bold text-gray-100">{count}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`${color} h-full`} style={{ width: pct }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card title="Financial Health" subtitle="Dynamic score index">
            <HealthScore />
          </Card>

          <AIInsightsCard />

          <div
            className="bg-blue-600 rounded-2xl p-6 shadow-2xl shadow-blue-900/30 relative overflow-hidden group cursor-pointer"
            onClick={() => navigate('/upgrade')}
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
            <Zap className="w-8 h-8 text-white mb-4" />
            <h4 className="text-lg font-black text-white leading-tight mb-2">Upgrade to Pro</h4>
            <p className="text-xs text-blue-100 leading-relaxed mb-6">Unlock AI Insights, multi-bank aggregation and advanced tax planning.</p>
            <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold">Get Started</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
