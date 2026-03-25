import React from 'react';
import { clsx } from 'clsx';
import { Zap, ArrowRight } from 'lucide-react';
import { MOCK_RECOMMENDATIONS } from '../../mockData';

const confidenceColor: Record<string, string> = {
  high:   'text-green-400',
  medium: 'text-amber-400',
  low:    'text-red-400',
};

export function AIInsights() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">AI Recommendations</span>
      </div>
      {MOCK_RECOMMENDATIONS.map((rec) => (
        <div key={rec.id} className="p-3 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-xs font-bold text-gray-100 leading-tight">{rec.title}</p>
            <span className={clsx('text-[9px] font-black uppercase shrink-0', confidenceColor[rec.confidence])}>
              {rec.confidence}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{rec.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-green-400">{rec.impact}</span>
            <button className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">
              {rec.action}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
