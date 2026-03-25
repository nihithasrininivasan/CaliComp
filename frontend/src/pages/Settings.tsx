import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  Palette, User, CreditCard, Building2, Bell, BookOpen, Shield,
} from 'lucide-react';

import { AppearanceTab }           from '../components/settings/AppearanceTab';
import { AccountTab }              from '../components/settings/AccountTab';
import { PlanBillingTab }          from '../components/settings/PlanBillingTab';
import { BankConnectionsTab }      from '../components/settings/BankConnectionsTab';
import { NotificationPrefsTab }    from '../components/settings/NotificationPrefsTab';
import { GlossaryTab }             from '../components/settings/GlossaryTab';
import { LegalTab }                from '../components/settings/LegalTab';

type TabId = 'appearance' | 'account' | 'plan' | 'banks' | 'notifications' | 'glossary' | 'legal';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'appearance',    label: 'Appearance',              icon: Palette    },
  { id: 'account',       label: 'Account',                 icon: User       },
  { id: 'plan',          label: 'Plan & Billing',          icon: CreditCard },
  { id: 'banks',         label: 'Bank Connections',        icon: Building2  },
  { id: 'notifications', label: 'Notification Preferences',icon: Bell       },
  { id: 'glossary',      label: 'Glossary',                icon: BookOpen   },
  { id: 'legal',         label: 'Legal & Compliance',      icon: Shield     },
];

export default function Settings() {
  const [active, setActive] = useState<TabId>('appearance');

  const content: Record<TabId, React.ReactNode> = {
    appearance:    <AppearanceTab />,
    account:       <AccountTab />,
    plan:          <PlanBillingTab />,
    banks:         <BankConnectionsTab />,
    notifications: <NotificationPrefsTab />,
    glossary:      <GlossaryTab />,
    legal:         <LegalTab />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
        <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">Preferences & Configuration</p>
      </div>

      <div className="flex gap-8 min-h-[600px]">
        {/* Left tab list */}
        <aside className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left',
                  active === id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content panel */}
        <div className="flex-1 bg-[#111827] border border-gray-800 rounded-2xl p-8 min-w-0">
          {content[active]}
        </div>
      </div>
    </div>
  );
}
