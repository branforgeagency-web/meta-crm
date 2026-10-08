import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Megaphone,
  UserCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Follow-ups', path: '/followups', icon: CalendarClock },
    { name: 'Campaigns', path: '/campaigns', icon: Megaphone },
    { name: 'Staff', path: '/staff', icon: UserCheck },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-crm-600 to-crm-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-crm-600/30 shrink-0">
              M
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-lg text-white tracking-tight font-sans">
                  Meta<span className="text-crm-500">CRM</span>
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Lead Automation
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-3 rounded-xl font-medium text-sm transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-crm-600 to-crm-500 text-white shadow-md shadow-crm-600/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center' : 'space-x-3'}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Internal System Tag */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-xl bg-slate-800/50 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center space-x-1.5 text-crm-400 font-semibold">
            <ShieldAlert size={14} />
            <span>Internal Admin Only</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Receiving Meta Instant Form leads automatically via Meta Graph API & Webhook.
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
