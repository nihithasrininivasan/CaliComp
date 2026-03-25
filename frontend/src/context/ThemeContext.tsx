import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextValue {
  isLight: boolean;
  toggleTheme: () => void;
  isCompact: boolean;
  toggleCompact: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');
  const [isCompact, setIsCompact] = useState(() => localStorage.getItem('compact') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }, [isLight]);

  useEffect(() => {
    localStorage.setItem('compact', isCompact ? 'true' : 'false');
  }, [isCompact]);

  return (
    <ThemeContext.Provider
      value={{
        isLight,
        toggleTheme: () => setIsLight((v) => !v),
        isCompact,
        toggleCompact: () => setIsCompact((v) => !v),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
