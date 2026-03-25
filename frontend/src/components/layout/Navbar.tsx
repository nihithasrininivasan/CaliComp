import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export function Navbar() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <header className="h-14 border-b border-gray-800 bg-[#0D1220]/80 backdrop-blur-sm px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Search transactions, vendors…"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-600 transition-colors"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Bell → /notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Gear → /settings */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>

        {/* Avatar → /profile */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 pl-4 border-l border-gray-800 hover:opacity-80 transition-opacity"
          aria-label="Profile"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">D</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-200">Demo User</p>
            <p className="text-[9px] text-gray-500">Admin</p>
          </div>
        </button>
      </div>
    </header>
  );
}
