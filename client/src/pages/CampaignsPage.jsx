import React, { useState, useEffect } from 'react';
import { leadService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Megaphone, Facebook, Instagram, TrendingUp, Layers, Loader2 } from 'lucide-react';

const CampaignsPage = () => {
  const [campaignStats, setCampaignStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { leadsVersion } = useNotification();

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        // Aggregated on the server across all leads
        const res = await leadService.getCampaignStats();
        setCampaignStats(res.campaigns);
      } catch (err) {
        console.error('Error loading campaign analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCampaignData();
  }, [leadsVersion]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <Megaphone className="w-6 h-6 text-crm-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Meta Ad Campaigns</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Performance and conversion breakdown by Facebook & Instagram lead ad campaigns
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-crm-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaignStats.length === 0 && (
            <p className="text-xs text-slate-400">No campaign data yet. Campaigns appear here once leads arrive.</p>
          )}
          {campaignStats.map((camp, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-crm-card dark:shadow-crm-dark-card space-y-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                      <Facebook size={16} />
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{camp.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">Sources: {camp.sourceList || '-'}</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {camp.conversionRate}% Converted
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Leads</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{camp.total}</span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacted</span>
                  <span className="text-lg font-extrabold text-crm-500">{camp.contacted}</span>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Converted</span>
                  <span className="text-lg font-extrabold text-emerald-500">{camp.converted}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
