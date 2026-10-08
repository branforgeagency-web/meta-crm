import React, { useState, useEffect } from 'react';
import { leadService, staffService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import LeadTable from '../components/leads/LeadTable';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import { CalendarClock, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

const FollowUpsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // upcoming | today | overdue
  const [staffList, setStaffList] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const { leadsVersion } = useNotification();

  const fetchFollowUpLeads = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Server returns every lead that has a follow-up date (not just the first page of all leads)
      const [res, staffRes] = await Promise.all([
        leadService.getLeads({ followUp: 'true', sort: 'followUpDate', limit: 1000 }),
        staffService.getStaff(),
      ]);
      setLeads(res.leads);
      setStaffList(staffRes.staff);
    } catch (err) {
      console.error('Error loading follow-ups:', err);
      setErrorMsg(err.response?.data?.message || 'Could not load follow-ups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUpLeads();
  }, [leadsVersion]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const isOpen = (l) => !['Converted', 'Closed', 'Not Interested'].includes(l.status);

  const todayFollowUps = leads.filter((l) => {
    if (!l.followUpDate || !isOpen(l)) return false;
    const d = new Date(l.followUpDate);
    return d >= startOfToday && d <= endOfToday;
  });

  const overdueFollowUps = leads.filter((l) => {
    if (!l.followUpDate) return false;
    const d = new Date(l.followUpDate);
    return d < startOfToday && isOpen(l);
  });

  const upcomingFollowUps = leads.filter((l) => {
    if (!l.followUpDate || !isOpen(l)) return false;
    const d = new Date(l.followUpDate);
    return d > endOfToday;
  });

  const displayLeads =
    activeTab === 'today'
      ? todayFollowUps
      : activeTab === 'overdue'
      ? overdueFollowUps
      : upcomingFollowUps;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <CalendarClock className="w-6 h-6 text-crm-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Scheduled Follow-ups</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Nurture Meta leads scheduled for follow-up calls & inquiries
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{errorMsg}</div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-crm-500 text-white shadow-md shadow-crm-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Clock size={14} />
          <span>Upcoming ({upcomingFollowUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-colors ${
            activeTab === 'today'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <CalendarClock size={14} />
          <span>Today ({todayFollowUps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition-colors ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <AlertCircle size={14} />
          <span>Overdue ({overdueFollowUps.length})</span>
        </button>
      </div>

      {/* Table Stream */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-crm-500 animate-spin" />
        </div>
      ) : (
        <LeadTable
          leads={displayLeads}
          staffList={staffList}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onStatusChange={async (id, status) => {
            try {
              await leadService.updateStatus(id, status);
            } catch (err) {
              setErrorMsg(err.response?.data?.message || 'Could not update status.');
            }
            fetchFollowUpLeads();
          }}
        />
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          staffList={staffList}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={fetchFollowUpLeads}
        />
      )}
    </div>
  );
};

export default FollowUpsPage;
