import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardList,
  GitMerge,
  FlaskConical,
  BrainCircuit,
  Upload,
  Sparkles,
  Target,
} from 'lucide-react';
import { usePlan } from '../../context/PlanContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  proOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/',               label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/transactions',   label: 'Transactions',   icon: ArrowLeftRight },
  { path: '/obligations',    label: 'Obligations',    icon: ClipboardList },
  { path: '/reconciliation', label: 'Reconciliation', icon: GitMerge },
  { path: '/simulation',     label: 'Simulation',     icon: FlaskConical },
  { path: '/goal-setting',   label: 'Goal Setting',   icon: Target },
  { path: '/ai-insights',    label: 'AI Insights',    icon: Sparkles, proOnly: true },
  { path: '/assistant',      label: 'AI Assistant',   icon: BrainCircuit },
  { path: '/upload',         label: 'Upload',         icon: Upload },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPro } = usePlan();

  return (
    <aside className="w-60 shrink-0 bg-[#0D1220] border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">CaliComp</p>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, icon: Icon, proOnly }) => {
          const active = location.pathname === path || (path === '/' && location.pathname === '/');
          const locked = proOnly && !isPro;

          return (
            <button
              key={path}
              onClick={() => navigate(locked ? '/upgrade' : path)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {proOnly && !isPro && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-900/40 text-blue-400 border border-blue-800/60 uppercase tracking-wider">
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom workspace tag */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Workspace</p>
          <p className="text-xs font-bold text-gray-300 mt-0.5">Demo Company</p>
        </div>
      </div>
    </aside>
  );
}
