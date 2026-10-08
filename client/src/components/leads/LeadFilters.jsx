import React from 'react';
import { Search, Filter, Download, RotateCcw, FileSpreadsheet, FileCode } from 'lucide-react';

const LeadFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  onExportCSV,
  onExportExcel,
  staffList = [],
  filterOptions = { courses: [], campaigns: [], sources: [] },
}) => {
  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-4 rounded-2xl shadow-crm-card dark:shadow-crm-dark-card space-y-3">
      {/* Top Search & Export Buttons Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search by name, phone, email, course, campaign..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-crm-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onResetFilters}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center space-x-1.5 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            onClick={onExportCSV}
            className="px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-1.5 hover:bg-emerald-100 transition-colors"
          >
            <FileCode size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onExportExcel}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Options Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</label>
          <select
            value={filters.status || 'All'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Interested">Interested</option>
            <option value="Converted">Converted</option>
            <option value="Not Interested">Not Interested</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Course / Program */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Course</label>
          <select
            value={filters.course || 'All'}
            onChange={(e) => onFilterChange('course', e.target.value)}
            className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="All">All Courses</option>
            {filterOptions.courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Campaign */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Campaign</label>
          <select
            value={filters.campaign || 'All'}
            onChange={(e) => onFilterChange('campaign', e.target.value)}
            className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="All">All Campaigns</option>
            {filterOptions.campaigns.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Source</label>
          <select
            value={filters.source || 'All'}
            onChange={(e) => onFilterChange('source', e.target.value)}
            className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="All">All Sources</option>
            {filterOptions.sources.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>

        {/* Assigned Staff */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Staff Member</label>
          <select
            value={filters.assignedTo || ''}
            onChange={(e) => onFilterChange('assignedTo', e.target.value)}
            className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="">All Staff</option>
            <option value="unassigned">Unassigned Only</option>
            {staffList.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Sort By</label>
          <select
            value={filters.sort || '-createdAt'}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">From Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full text-xs p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">To Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full text-xs p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default LeadFilters;
