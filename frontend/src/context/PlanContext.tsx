import React, { createContext, useContext, useState, useCallback } from 'react';

interface PlanContextValue {
  isPro: boolean;
  upgradeToPro: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(() => localStorage.getItem('isPro') === 'true');

  const upgradeToPro = useCallback(() => {
    localStorage.setItem('isPro', 'true');
    setIsPro(true);
  }, []);

  return (
    <PlanContext.Provider value={{ isPro, upgradeToPro }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}
