import React from 'react';
import { Moon, Sun, LayoutList, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? 'bg-blue-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-bold text-gray-100">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 max-w-sm">{description}</p>
      </div>
      <div className="shrink-0 ml-8">{children}</div>
    </div>
  );
}

export function AppearanceTab() {
  const { isLight, toggleTheme, isCompact, toggleCompact } = useTheme();

  return (
    <div>
      <h3 className="text-base font-black text-white mb-1">Appearance</h3>
      <p className="text-xs text-gray-500 mb-8">Customise how CaliComp looks on your device.</p>

      <SettingRow
        title="Theme"
        description="Switch between dark mode (default) and light mode. Light mode uses a clean white/grey palette."
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1">
            <button
              onClick={() => isLight && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isLight ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Dark
            </button>
            <button
              onClick={() => !isLight && toggleTheme()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isLight ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Light
            </button>
          </div>
        </div>
      </SettingRow>

      <SettingRow
        title="Compact View"
        description="Reduces padding and spacing density across all tables and cards."
      >
        <div className="flex items-center gap-3">
          {isCompact ? (
            <LayoutList className="w-4 h-4 text-blue-400" />
          ) : (
            <LayoutGrid className="w-4 h-4 text-gray-500" />
          )}
          <Toggle on={isCompact} onToggle={toggleCompact} />
        </div>
      </SettingRow>
    </div>
  );
}
