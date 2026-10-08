import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadService, staffService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/dashboard/StatCard';
import ActivityChart from '../components/dashboard/ActivityChart';
import SourceChart from '../components/dashboard/SourceChart';
import LeadTable from '../components/leads/LeadTable';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import AddLeadModal from '../components/leads/AddLeadModal';
import {
  Users,
  UserPlus,
  PhoneCall,
  Heart,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ activityOverTime: [], sourceBreakdown: [], courseBreakdown: [] });
  const [recentLeads, setRecentLeads] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const { leadsVersion } = useNotification();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, leadsRes, staffRes] = await Promise.all([
        leadService.getStats(),
        leadService.getLeads({ limit: 8, sort: '-createdAt' }),
        staffService.getStaff(),
      ]);
      setStats(statsRes.stats);
      setCharts(statsRes.charts);
      setRecentLeads(leadsRes.leads);
      setStaffList(staffRes.staff);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [leadsVersion]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await leadService.updateStatus(id, newStatus);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-crm-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Loading Meta CRM Dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-crm-500 text-white rounded-full">
              Live Lead Feed
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1.5">
            Meta Lead Management CRM
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time dashboard tracking Facebook & Instagram Instant Form submissions, conversion rates, and staff lead assignments.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => setShowAddLeadModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-crm-600 to-crm-500 hover:from-crm-700 text-xs font-bold text-white rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <UserPlus size={14} />
            <span>Add Lead</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh Dashboard"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 8 Metric KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads}
          icon={Users}
          color="crm"
          subtitle="All leads"
          onClick={() => navigate('/leads')}
        />
        <StatCard
          title="New Leads"
          value={stats?.newLeads}
          icon={UserPlus}
          color="blue"
          subtitle="Uncontacted leads"
          onClick={() => navigate('/leads?status=New')}
        />
        <StatCard
          title="Contacted"
          value={stats?.contactedLeads}
          icon={PhoneCall}
          color="purple"
          subtitle="In communication"
          onClick={() => navigate('/leads?status=Contacted')}
        />
        <StatCard
          title="Interested"
          value={stats?.interestedLeads}
          icon={Heart}
          color="amber"
          subtitle="Qualified prospects"
          onClick={() => navigate('/leads?status=Interested')}
        />
        <StatCard
          title="Converted"
          value={stats?.convertedLeads}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Enrolled / Paid"
          onClick={() => navigate('/leads?status=Converted')}
        />
        <StatCard
          title="Not Interested"
          value={stats?.notInterestedLeads}
          icon={XCircle}
          color="rose"
          subtitle="Opted out"
          onClick={() => navigate('/leads?status=Not Interested')}
        />
        <StatCard
          title="Today's Leads"
          value={stats?.todayLeads}
          icon={Clock}
          color="crm"
          subtitle="Captured today"
        />
        <StatCard
          title="This Week"
          value={stats?.thisWeekLeads}
          icon={Calendar}
          color="blue"
          subtitle="Last 7 days"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart data={charts.activityOverTime} />
        </div>
        <div>
          <SourceChart data={charts.courseBreakdown} title="Courses / Programs Breakdown" />
        </div>
      </div>

      {/* Recent Leads Feed Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Meta Leads</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest instant form submissions received</p>
          </div>
          <button
            onClick={() => navigate('/leads')}
            className="text-xs font-bold text-crm-500 hover:text-crm-600 flex items-center space-x-1"
          >
            <span>View All Leads ({stats?.totalLeads || 0})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <LeadTable
          leads={recentLeads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onStatusChange={handleStatusChange}
          staffList={staffList}
        />
      </div>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <AddLeadModal
          staffList={staffList}
          onClose={() => setShowAddLeadModal(false)}
          onLeadCreated={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* Lead Detail Profile Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          staffList={staffList}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
