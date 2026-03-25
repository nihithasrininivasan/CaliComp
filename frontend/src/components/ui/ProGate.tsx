import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock } from 'lucide-react';
import { usePlan } from '../../context/PlanContext';
import { Button } from './Common';

interface ProGateProps {
  children: React.ReactNode;
  /** Shown as the feature name in the blur overlay */
  featureName?: string;
  /** If true, renders as a full-page gate instead of a card overlay */
  fullPage?: boolean;
}

export function ProGate({ children, featureName = 'This feature', fullPage = false }: ProGateProps) {
  const { isPro } = usePlan();
  const navigate = useNavigate();

  if (isPro) return <>{children}</>;

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-blue-900/30 border border-blue-800/50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white mb-2">{featureName} is a Pro feature</h2>
          <p className="text-sm text-gray-400 max-w-md">
            Upgrade to CaliComp Pro to unlock AI-powered insights, unlimited uploads, and bank AA connections.
          </p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 px-8 py-3 text-sm" onClick={() => navigate('/upgrade')}>
          <Zap className="w-4 h-4" />
          Upgrade to Pro →
        </Button>
        <p className="text-[10px] text-gray-600">₹2,999/month · Cancel anytime</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Blurred content underneath */}
      <div className="blur-sm pointer-events-none select-none opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111827]/60 backdrop-blur-[2px] rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-800/60 flex items-center justify-center">
          <Lock className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-xs font-bold text-gray-200">{featureName} is a Pro feature</p>
        <Button
          variant="primary"
          className="flex items-center gap-1.5 text-xs px-4 py-2"
          onClick={() => navigate('/upgrade')}
        >
          <Zap className="w-3.5 h-3.5" />
          Upgrade to Pro →
        </Button>
      </div>
    </div>
  );
}
