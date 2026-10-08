import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useSearchParams } from 'react-router-dom';
import { leadService, staffService } from '../services/api';
import { exportToCSV, exportToExcel } from '../utils/exportUtils';
import LeadFilters from '../components/leads/LeadFilters';
import LeadTable from '../components/leads/LeadTable';
import LeadDetailModal from '../components/leads/LeadDetailModal';
import AddLeadModal from '../components/leads/AddLeadModal';
import { Users, Loader2, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

const LeadsPage = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const { leadsVersion } = useNotification();

  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [filterOptions, setFilterOptions] = useState({ courses: [], campaigns: [], sources: [] });
  const [errorMsg, setErrorMsg] = useState('');

  const [filters, setFilters] = useState({
    search: initialSearch,
    status: initialStatus,
    campaign: 'All',
    course: 'All',
    source: 'All',
    assignedTo: '',
    sort: '-createdAt',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 25,
  });

  const fetchLeadsAndStaff = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [leadsRes, staffRes, optionsRes] = await Promise.all([
        leadService.getLeads(filters),
        staffService.getStaff(),
        leadService.getFilterOptions(),
      ]);
      setLeads(leadsRes.leads);
      setTotalLeads(leadsRes.totalLeads);
      setTotalPages(leadsRes.totalPages);
      setStaffList(staffRes.staff);
      setFilterOptions(optionsRes);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setErrorMsg(err.response?.data?.message || 'Could not load leads. Check that the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Keep filters in sync when the URL changes (e.g. global search from the top bar)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlStatus = searchParams.get('status') || 'All';
    setFilters((prev) =>
      prev.search === urlSearch && prev.status === urlStatus ? prev : { ...prev, search: urlSearch, status: urlStatus, page: 1 }
    );
  }, [searchParams]);

  // Debounce so typing in search doesn't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(fetchLeadsAndStaff, 300);
    return () => clearTimeout(t);
  }, [filters, leadsVersion]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'All',
      campaign: 'All',
      course: 'All',
      source: 'All',
      assignedTo: '',
      sort: '-createdAt',
      startDate: '',
    endDate: '',
      page: 1,
      limit: 25,
    });
  };

  const handleInlineStatusChange = async (id, newStatus) => {
    try {
      await leadService.updateStatus(id, newStatus);
      fetchLeadsAndStaff();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { page, limit, ...exportFilters } = filters;
      const res = await leadService.exportLeads(exportFilters);
      exportToCSV(res.data, `Meta_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const { page, limit, ...exportFilters } = filters;
      const res = await leadService.exportLeads(exportFilters);
      exportToExcel(res.data, `Meta_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export Excel error:', err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-crm-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Leads Management</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {leads.length} of {totalLeads} leads
          </p>
        </div>

        {/* Real Data Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddLeadModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-crm-600 to-crm-500 hover:from-crm-700 hover:to-crm-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-crm-600/20 flex items-center space-x-1.5 transition-all"
          >
            <UserPlus size={15} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{errorMsg}</div>
      )}

      {/* Multi-filter control bar */}
      <LeadFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        staffList={staffList}
        filterOptions={filterOptions}
      />

      {/* Leads Data Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl">
          <Loader2 className="w-7 h-7 text-crm-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading leads...</p>
        </div>
      ) : (
        <LeadTable
          leads={leads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onStatusChange={handleInlineStatusChange}
          staffList={staffList}
        />
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-200 dark:border-dark-border text-xs text-slate-500">
          <span>
            Page {filters.page} of {totalPages} ({totalLeads} total leads)
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={filters.page >= totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <AddLeadModal
          staffList={staffList}
          onClose={() => setShowAddLeadModal(false)}
          onLeadCreated={() => {
            fetchLeadsAndStaff();
          }}
        />
      )}

      {/* Lead Detail Drawer Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          staffList={staffList}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={() => {
            fetchLeadsAndStaff();
          }}
        />
      )}
    </div>
  );
};

export default LeadsPage;
