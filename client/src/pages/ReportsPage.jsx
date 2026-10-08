import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import ActivityChart from '../components/dashboard/ActivityChart';
import SourceChart from '../components/dashboard/SourceChart';
import { BarChart3, TrendingUp, Download, PieChart, Loader2 } from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ activityOverTime: [], sourceBreakdown: [], courseBreakdown: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await leadService.getStats();
        setStats(res.stats);
        setCharts(res.charts);
      } catch (err) {
        console.error('Error fetching report stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportFullReport = async () => {
    try {
      const res = await leadService.exportLeads();
      exportToCSV(res.data, `Meta_CRM_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Error exporting analytics report:', err);
    }
  };

  const conversionRate = stats?.totalLeads
    ? ((stats.convertedLeads / stats.totalLeads) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-crm-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Conversion Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Meta Ads performance metrics, conversion ratios, and lead distribution insights
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="px-4 py-2.5 bg-gradient-to-r from-crm-600 to-crm-500 text-white font-bold text-xs rounded-xl shadow-md shadow-crm-600/20 flex items-center space-x-2 hover:scale-[1.02] transition-all self-start"
        >
          <Download size={14} />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-crm-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-crm-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Overall Conversion Rate</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-emerald-500">{conversionRate}%</span>
                <span className="text-xs text-slate-400">Converted to Customers</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-crm-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Qualified Prospects</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-crm-500">
                  {(stats?.interestedLeads || 0) + (stats?.contactedLeads || 0)}
                </span>
                <span className="text-xs text-slate-400">Contacted / Interested</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-crm-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Captured Leads</span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stats?.totalLeads || 0}
                </span>
                <span className="text-xs text-slate-400">All sources</span>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityChart data={charts.activityOverTime} />
            <SourceChart data={charts.courseBreakdown} title="Course Interest Distribution" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SourceChart data={charts.sourceBreakdown} title="Lead Source Distribution" />
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
