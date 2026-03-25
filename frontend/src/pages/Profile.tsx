import React, { useState } from 'react';
import { Edit2, Save, X, ArrowLeftRight, ClipboardList, FileUp, CheckCircle, GitMerge, Sparkles } from 'lucide-react';
import { Button, Badge } from '../components/ui/Common';
import { useToast } from '../context/ToastContext';
import { useTransactionStore } from '../store/transactionStore';
import { MOCK_OBLIGATIONS } from '../services/mockData';

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  transaction: ArrowLeftRight,
  obligation: ClipboardList,
  upload: FileUp,
  reconciliation: GitMerge,
  insight: Sparkles,
};

const RECENT_ACTIVITY = [
  { id: 1, type: 'reconciliation', label: 'Confirmed match: Office Rent ↔ ₹45,000 bank debit', time: '2 hours ago' },
  { id: 2, type: 'obligation',     label: 'Deferred TechSupplies payment to Apr 6, 2026',       time: '5 hours ago' },
  { id: 3, type: 'transaction',    label: 'Added manual transaction: AWS Cloud ₹12,500',         time: 'Yesterday' },
  { id: 4, type: 'upload',         label: 'Uploaded invoice: Sharma_Textiles_Mar26.pdf',         time: '2 days ago' },
  { id: 5, type: 'insight',        label: 'Refreshed AI Insights — 3 new recommendations',       time: '3 days ago' },
];

export default function Profile() {
  const { showToast } = useToast();
  const { transactions } = useTransactionStore();

  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState('Demo User');
  const [gstin,   setGstin]   = useState('27AABCU9603R1ZX');
  const [tempName,  setTempName]  = useState(name);
  const [tempGstin, setTempGstin] = useState(gstin);

  function handleSave() {
    setName(tempName.trim() || name);
    setGstin(tempGstin.trim() || gstin);
    setEditing(false);
    showToast('Profile updated.');
  }

  function handleCancel() {
    setTempName(name);
    setTempGstin(gstin);
    setEditing(false);
  }

  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Profile</h2>
          <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Your account details</p>
        </div>
        {!editing ? (
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" className="flex items-center gap-2" onClick={handleSave}>
              <Save className="w-4 h-4" /> Save
            </Button>
            <Button variant="outline" className="flex items-center gap-2" onClick={handleCancel}>
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Avatar + main info */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-lg shadow-blue-900/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            {editing ? (
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-gray-900 border border-blue-600 rounded-xl px-3 py-1.5 text-lg font-black text-white focus:outline-none w-full max-w-xs"
              />
            ) : (
              <h3 className="text-xl font-black text-white">{name}</h3>
            )}
            <p className="text-sm text-gray-400">demo@calicomp.in</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="info">Admin</Badge>
              <Badge variant="default">Free Plan</Badge>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Company Name', value: 'Demo Company', editable: false },
            { label: 'Member Since',  value: 'January 2026',  editable: false },
            { label: 'Email',         value: 'demo@calicomp.in', editable: false },
            { label: 'Role',          value: 'Admin',          editable: false },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-200">{value}</p>
            </div>
          ))}

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">GSTIN</p>
            {editing ? (
              <input
                value={tempGstin}
                onChange={(e) => setTempGstin(e.target.value)}
                className="bg-gray-900 border border-blue-600 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none w-full"
                placeholder="27AABCU9603R1ZX"
              />
            ) : (
              <p className="text-sm font-bold text-gray-200 font-mono">{gstin}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Transactions',       value: transactions.length,        icon: ArrowLeftRight },
          { label: 'Obligations Tracked',      value: MOCK_OBLIGATIONS.length,    icon: ClipboardList  },
          { label: 'Documents Uploaded',       value: 4,                          icon: FileUp         },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#111827] border border-gray-800 rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h4 className="text-sm font-bold text-gray-100">Recent Activity</h4>
          <p className="text-[10px] text-gray-500 mt-0.5">Last 5 actions taken in CaliComp</p>
        </div>
        <div className="divide-y divide-gray-800/50">
          {RECENT_ACTIVITY.map(({ id, type, label, time }) => {
            const Icon = ACTIVITY_ICONS[type] ?? CheckCircle;
            return (
              <div key={id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-800/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-300 flex-1">{label}</p>
                <span className="text-[10px] text-gray-600 shrink-0">{time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
