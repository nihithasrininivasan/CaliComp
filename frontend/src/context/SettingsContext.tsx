// @BACKEND-PROMPT (SettingsContext):
// Build POST /api/v1/settings — save user settings including emergency_fund_target
// and notification preferences to the DB (UserSettings table).
// Build GET /api/v1/settings — return current settings for authenticated user.
// UserSettings schema: {user_id, emergency_fund_target, alert_threshold,
//   theme, notification_prefs_json, updated_at}
// On every pipeline run, check if cash_balance < emergency_fund_target and if so
// create an EMERGENCY_FUND notification automatically.

import React, { createContext, useContext, useState } from 'react';

export type AlertThreshold = 'within10pct' | 'equals' | 'below';

export interface EmergencyFundSettings {
  target:    number;
  threshold: AlertThreshold;
}

// Default: 3 × estimated monthly expenses (₹1,50,000 conservative estimate)
const DEFAULT_EF: EmergencyFundSettings = {
  target:    450000,
  threshold: 'below',
};

function loadFromStorage(): EmergencyFundSettings {
  try {
    const raw = localStorage.getItem('emergencyFund');
    if (raw) return JSON.parse(raw) as EmergencyFundSettings;
  } catch {}
  return DEFAULT_EF;
}

interface SettingsContextValue {
  emergencyFund:    EmergencyFundSettings;
  setEmergencyFund: (ef: EmergencyFundSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [emergencyFund, setEFState] = useState<EmergencyFundSettings>(loadFromStorage);

  function setEmergencyFund(ef: EmergencyFundSettings) {
    setEFState(ef);
    localStorage.setItem('emergencyFund', JSON.stringify(ef));
  }

  return (
    <SettingsContext.Provider value={{ emergencyFund, setEmergencyFund }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
