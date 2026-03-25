import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, FileText } from 'lucide-react';
import { Button, Badge } from '../ui/Common';
import { usePlan } from '../../context/PlanContext';

const FREE_FEATURES = [
  'Dashboard & KPIs',
  'Transactions (manual + CSV)',
  'Obligations tracking',
  'Reconciliation centre',
  'Scenario simulation',
  'Document upload',
];

const PRO_FEATURES = [
  'Everything in Free',
  'AI Insights (GPT-4o powered)',
  'AI Insights card on Dashboard',
  'Priority support',
  'Unlimited document uploads',
  'Bank AA connection (Finvu / OneMoney)',
];

export function PlanBillingTab() {
  const navigate = useNavigate();
  const { isPro } = usePlan();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-base font-black text-white mb-1">Plan & Billing</h3>
        <p className="text-xs text-gray-500">Your current subscription and billing history.</p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Free */}
        <div className={`rounded-2xl border p-6 ${!isPro ? 'border-blue-600 bg-blue-900/10' : 'border-gray-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-black text-white">Free</p>
              <p className="text-xs text-gray-500 mt-0.5">Current plan</p>
            </div>
            {!isPro && <Badge variant="info">ACTIVE</Badge>}
          </div>
          <p className="text-2xl font-black text-white mb-1">₹0<span className="text-sm font-medium text-gray-500">/mo</span></p>
          <ul className="mt-4 space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5 text-green-400 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`rounded-2xl border p-6 relative overflow-hidden ${isPro ? 'border-blue-600 bg-blue-900/10' : 'border-gray-700'}`}>
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-black text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" /> Pro
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Recommended</p>
            </div>
            {isPro && <Badge variant="info">ACTIVE</Badge>}
          </div>
          <p className="text-2xl font-black text-white mb-1">₹2,999<span className="text-sm font-medium text-gray-500">/mo</span></p>
          <ul className="mt-4 space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" /> {f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <Button
              variant="primary"
              className="w-full mt-5 flex items-center justify-center gap-2"
              onClick={() => navigate('/upgrade')}
            >
              <Zap className="w-4 h-4" /> Upgrade to Pro
            </Button>
          )}
        </div>
      </div>

      {/* Billing history */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-sm font-bold text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" /> Billing History
        </h4>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl px-6 py-10 flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-gray-700" />
          <p className="text-sm font-bold text-gray-500">No invoices yet</p>
          <p className="text-xs text-gray-600">Invoices will appear here after your first payment.</p>
        </div>
      </div>
    </div>
  );
}
