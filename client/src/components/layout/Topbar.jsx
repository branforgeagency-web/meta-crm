import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Search,
  Bell,
  Volume2,
  VolumeX,
  LogOut,
  User,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

const Topbar = ({ onGlobalSearch }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, soundEnabled, toggleSound, markAllAsRead } = useNotification();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() && onGlobalSearch) {
      onGlobalSearch(searchQuery.trim());
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Global Search & Quick Actions */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search leads and press Enter..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-xl border border-transparent focus:border-crm-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Actions & Admin Profile */}
      <div className="flex items-center space-x-3">
        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={soundEnabled ? 'Lead Chime Audio Active' : 'Lead Chime Muted'}
        >
          {soundEnabled ? <Volume2 size={18} className="text-emerald-500" /> : <VolumeX size={18} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Real-time Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-crm-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell size={16} className="text-crm-500" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Lead Alerts</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-crm-500 hover:text-crm-600 font-semibold flex items-center space-x-1"
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No lead notifications yet. New leads will appear here instantly.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        !n.read ? 'bg-crm-50/40 dark:bg-crm-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{n.lead.source}</span>
                        <span className="text-crm-500 font-medium">Status: {n.lead.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
              <User size={18} />
            </div>
            <div className="hidden md:block text-left">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.name}
              </span>
              <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[9px] font-bold uppercase rounded bg-crm-100 text-crm-700 dark:bg-crm-950 dark:text-crm-300">
                {user?.role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Logout of CRM"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
