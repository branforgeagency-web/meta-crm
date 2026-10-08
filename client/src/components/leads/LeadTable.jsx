import React from 'react';
import StatusBadge from './StatusBadge';
import { Phone, MessageCircle, Eye, User, Calendar, ExternalLink } from 'lucide-react';

const LeadTable = ({ leads = [], onSelectLead, onStatusChange, staffList = [] }) => {
  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-crm-card dark:shadow-crm-dark-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3.5 px-4">Lead Name</th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4">Course / Program</th>
              <th className="py-3.5 px-4">Source / Campaign</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Assigned Staff</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const phoneDigits = (lead.phone || '').replace(/[^0-9]/g, '');
                const waUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : '#';

                return (
                  <tr
                    key={lead._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectLead(lead)}
                  >
                    {/* Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0">
                          {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block group-hover:text-crm-500 transition-colors">
                            {lead.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {lead.metaLeadId || lead._id?.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5" onClick={(e) => e.stopPropagation()}>
                        <span className="block font-semibold text-slate-800 dark:text-slate-200">
                          {lead.phone || 'No phone'}
                        </span>
                        <span className="block text-[11px] text-slate-400 truncate max-w-[160px]">
                          {lead.email || 'No email'}
                        </span>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block font-semibold text-crm-600 dark:text-crm-400 bg-crm-50 dark:bg-crm-950/40 px-2 py-0.5 rounded-lg border border-crm-200/60 dark:border-crm-900/60">
                        {lead.course || '-'}
                      </span>
                    </td>

                    {/* Source & Campaign */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {lead.source || '-'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                          {lead.campaignName || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Status inline selector */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => onStatusChange(lead._id, e.target.value)}
                        className="text-xs font-semibold p-1 rounded-lg bg-transparent border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-crm-500 cursor-pointer"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Interested">Interested</option>
                        <option value="Converted">Converted</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>

                    {/* Assigned Staff */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 dark:text-slate-300">
                        {lead.assignedTo?.name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Call Lead"
                        >
                          <Phone size={15} />
                        </a>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
                          title="WhatsApp Chat"
                        >
                          <MessageCircle size={15} />
                        </a>
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 rounded-lg text-crm-500 hover:bg-crm-50 dark:hover:bg-crm-950/40 transition-colors"
                          title="View Full Profile"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;
