import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Common';

interface Pref { id: string; label: string; description: string }

const PREFS: Pref[] = [
  { id: 'overdue',    label: 'Overdue obligations',          description: 'Alert when a payment is past its due date.' },
  { id: 'upcoming',  label: 'Upcoming obligations (3 days)', description: 'Reminder 3 days before a payment is due.' },
  { id: 'insights',  label: 'AI insights',                   description: 'Notify when new AI-generated insights are ready.' },
  { id: 'recon',     label: 'Reconciliation matches',        description: 'Alert when a potential bank match is found.' },
  { id: 'weekly',    label: 'Weekly summary email',          description: 'Receive a weekly digest of your financial health.' },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export function NotificationPrefsTab() {
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    overdue: true, upcoming: true, insights: true, recon: false, weekly: false,
  });

  function toggle(id: string) {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-black text-white mb-1">Notification Preferences</h3>
        <p className="text-xs text-gray-500">Control which alerts CaliComp sends you.</p>
      </div>

      <div className="divide-y divide-gray-800">
        {PREFS.map(({ id, label, description }) => (
          <div key={id} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-bold text-gray-100">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <div className="shrink-0 ml-8">
              <Toggle on={!!prefs[id]} onToggle={() => toggle(id)} />
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" className="text-xs" onClick={() => showToast('Notification preferences saved.')}>
        Save Preferences
      </Button>
    </div>
  );
}
