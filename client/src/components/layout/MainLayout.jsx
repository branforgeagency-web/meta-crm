import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useNotification } from '../../context/NotificationContext';
import { X, Bell } from 'lucide-react';

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { latestLeadAlert, dismissToast } = useNotification();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text flex">
      {/* Sidebar Navigation */}
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Topbar onGlobalSearch={(q) => navigate(`/leads?search=${encodeURIComponent(q)}`)} />

        {/* Real-time Incoming Lead Floating Toast Banner */}
        {latestLeadAlert && (
          <div className="fixed top-20 right-6 z-50 animate-slide-up max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-crm-500/50 flex items-start justify-between space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-crm-600 to-crm-500 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white truncate">{latestLeadAlert.name}</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-crm-500 text-white rounded">NEW LEAD</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{latestLeadAlert.course || latestLeadAlert.campaignName || latestLeadAlert.source}</p>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-2">
                <span>{latestLeadAlert.phone || latestLeadAlert.email}</span>
                <span>•</span>
                <span className="text-crm-400 font-medium">{latestLeadAlert.source}</span>
              </div>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Route Page Container */}
        <main className="p-6 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
