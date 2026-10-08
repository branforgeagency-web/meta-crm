import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'crm', change, subtitle, onClick }) => {
  const colorStyles = {
    crm: 'from-crm-500/10 to-crm-600/5 text-crm-500 border-crm-200 dark:border-crm-900/40',
    blue: 'from-blue-500/10 to-blue-600/5 text-blue-500 border-blue-200 dark:border-blue-900/40',
    purple: 'from-purple-500/10 to-purple-600/5 text-purple-500 border-purple-200 dark:border-purple-900/40',
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-500 border-emerald-200 dark:border-emerald-900/40',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-500 border-amber-200 dark:border-amber-900/40',
    rose: 'from-rose-500/10 to-rose-600/5 text-rose-500 border-rose-200 dark:border-rose-900/40',
  };

  const iconBgStyles = {
    crm: 'bg-crm-500/10 text-crm-500 dark:bg-crm-500/20',
    blue: 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 dark:bg-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-200/80 dark:border-dark-border shadow-crm-card dark:shadow-crm-dark-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group cursor-pointer`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${colorStyles[color]} rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 block tracking-tight">
            {value ?? 0}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
              {subtitle}
            </span>
          )}
        </div>

        <div className={`p-3 rounded-2xl ${iconBgStyles[color]} transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
