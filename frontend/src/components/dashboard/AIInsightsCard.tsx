import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sparkles, ChevronRight, Loader } from 'lucide-react';
import { Card, Button } from '../ui/Common';
import { ProGate } from '../ui/ProGate';
import { generateInsights } from '../../services/aiInsights';
import type { AIInsight } from '../../types';

const PRIORITY_COLOR: Record<AIInsight['priority'], string> = {
  HIGH:   'text-red-400 bg-red-900/20 border-red-900/40',
  MEDIUM: 'text-amber-400 bg-amber-900/20 border-amber-900/40',
  LOW:    'text-green-400 bg-green-900/20 border-green-900/40',
};

const CATEGORY_COLOR: Record<AIInsight['category'], string> = {
  DEFERRAL:   'text-blue-400',
  COLLECTION: 'text-purple-400',
  COMPLIANCE: 'text-red-400',
  CASHFLOW:   'text-green-400',
};

export function AIInsightsCard() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    generateInsights().then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  return (
    <Card title="AI Insights" className="bg-gradient-to-br from-[#111827] to-[#1F2937]">
      <ProGate featureName="AI Insights">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-xs text-gray-500">Generating insights…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 2).map((ins) => (
              <div key={ins.id} className="p-3 bg-gray-900/60 border border-gray-800/80 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className={clsx('w-3.5 h-3.5 shrink-0', CATEGORY_COLOR[ins.category])} />
                    <p className="text-xs font-bold text-gray-100 truncate">{ins.title}</p>
                  </div>
                  <span className={clsx('text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0', PRIORITY_COLOR[ins.priority])}>
                    {ins.priority}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">{ins.body}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-green-400">{ins.impact}</span>
                  <button
                    onClick={() => navigate(ins.actionRoute)}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                  >
                    {ins.actionLabel} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/ai-insights')}
              className="w-full text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 pt-1 transition-colors"
            >
              View All Insights <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </ProGate>
    </Card>
  );
}
