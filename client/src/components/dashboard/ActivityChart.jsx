import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ActivityChart = ({ data }) => {
  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-crm-card dark:shadow-crm-dark-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Lead Volume Over Time</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Incoming Meta Ads Instant Form Leads (Past 14 Days)</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold bg-crm-50 dark:bg-crm-950/60 text-crm-600 dark:text-crm-400 rounded-lg border border-crm-200 dark:border-crm-800">
          Live Sync
        </span>
      </div>

      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
            <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              name="Total Leads"
              stroke="#ef4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorLeads)"
            />
            <Area
              type="monotone"
              dataKey="converted"
              name="Converted Leads"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConverted)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityChart;
