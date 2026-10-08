import React, { useState } from 'react';
import { leadService, metaService } from '../../services/api';
import StatusBadge from './StatusBadge';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  User,
  Calendar,
  Clock,
  Send,
  UserPlus,
  Tag,
  Facebook,
  MapPin,
  BookOpen,
  CheckCircle2,
  FileText,
} from 'lucide-react';

const LeadDetailModal = ({ lead: initialLead, staffList = [], onClose, onLeadUpdated }) => {
  const [lead, setLead] = useState(initialLead);
  const [status, setStatus] = useState(initialLead.status || 'New');
  const [assignedStaff, setAssignedStaff] = useState(
    initialLead.assignedTo?._id || initialLead.assignedTo || ''
  );
  const [followUpDate, setFollowUpDate] = useState(() => {
    if (!initialLead.followUpDate) return '';
    const dt = new Date(initialLead.followUpDate);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const toDateInput = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };

  // Apply the server's copy of the lead so every control reflects saved data
  const syncFromServer = (updated) => {
    setLead(updated);
    setStatus(updated.status);
    setAssignedStaff(updated.assignedTo?._id || updated.assignedTo || '');
    setFollowUpDate(toDateInput(updated.followUpDate));
    if (onLeadUpdated) onLeadUpdated(updated);
  };

  const runUpdate = async (fn, successMsg) => {
    setErrorMessage('');
    try {
      const res = await fn();
      syncFromServer(res.lead);
      showTemporaryMessage(res.message || successMsg);
      return true;
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Could not save the change. Please try again.');
      // Roll controls back to the last saved values
      setStatus(lead.status);
      setAssignedStaff(lead.assignedTo?._id || lead.assignedTo || '');
      setFollowUpDate(toDateInput(lead.followUpDate));
      return false;
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    runUpdate(() => leadService.updateStatus(lead._id, newStatus), `Status updated to ${newStatus}`);
  };

  const handleStaffAssign = (staffId) => {
    setAssignedStaff(staffId);
    runUpdate(() => leadService.assignLead(lead._id, staffId), 'Staff assignment saved');
  };

  const handleScheduleFollowUp = (dateVal) => {
    setFollowUpDate(dateVal);
    // Send a local-time value so the chosen day doesn't shift across timezones
    const payload = dateVal ? new Date(`${dateVal}T09:00:00`).toISOString() : null;
    runUpdate(() => leadService.scheduleFollowUp(lead._id, payload), 'Follow-up scheduled');
  };

  const handleRefreshFromMeta = async () => {
    setRefreshing(true);
    await runUpdate(() => metaService.refreshLead(lead._id), 'Lead refreshed from Meta');
    setRefreshing(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setIsSubmittingNote(true);
    const ok = await runUpdate(() => leadService.addNote(lead._id, newNoteText), 'Note added to timeline');
    if (ok) setNewNoteText('');
    setIsSubmittingNote(false);
  };

  const showTemporaryMessage = (msg) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2500);
  };

  // Format phone for WhatsApp link
  const rawPhone = (lead.phone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = rawPhone ? `https://wa.me/${rawPhone}` : '#';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-dark-card h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200 dark:border-dark-border animate-slide-up">
        {/* Header Bar */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-crm-600 to-crm-500 flex items-center justify-center text-white font-bold text-lg">
              {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
            </div>
            <div>
              <h2 className="text-lg font-bold">{lead.name}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span>{lead.metaLeadId ? `Meta Lead ID: ${lead.metaLeadId}` : `Lead ID: ${lead._id}`}</span>
                <span>•</span>
                <span className="text-crm-400 font-medium">{lead.source}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Save message notification pill */}
        {saveMessage && (
          <div className="bg-emerald-500 text-white text-xs font-semibold py-2 px-4 text-center animate-fade-in flex items-center justify-center space-x-1.5">
            <CheckCircle2 size={14} />
            <span>{saveMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500 text-white text-xs font-semibold py-2 px-4 text-center">{errorMessage}</div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Quick Contact Actions */}
          <div className="grid grid-cols-3 gap-3">
            <a
              href={lead.phone ? `tel:${lead.phone}` : undefined}
              aria-disabled={!lead.phone}
              className="flex items-center justify-center space-x-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs hover:bg-emerald-100 transition-colors"
            >
              <Phone size={16} />
              <span>Call Lead</span>
            </a>

            <a
              href={rawPhone ? whatsappUrl : undefined}
              aria-disabled={!rawPhone}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-2xl border border-teal-200 dark:border-teal-800/60 font-semibold text-xs hover:bg-teal-100 transition-colors"
            >
              <MessageCircle size={16} />
              <span>WhatsApp</span>
            </a>

            <a
              href={lead.email ? `mailto:${lead.email}` : undefined}
              aria-disabled={!lead.email}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-800/60 font-semibold text-xs hover:bg-blue-100 transition-colors"
            >
              <Mail size={16} />
              <span>Email</span>
            </a>
          </div>

          {/* Lead Controls: Status & Staff Assignment */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lead Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-crm-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Interested">Interested</option>
                <option value="Converted">Converted</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Assign Staff
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => handleStaffAssign(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-crm-500"
              >
                <option value="">Unassigned</option>
                {staffList
                  .filter((s) => s.status === 'active' || (s._id || s.id) === assignedStaff)
                  .map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Schedule Follow-up
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => handleScheduleFollowUp(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-crm-500"
              />
            </div>
          </div>

          {/* Lead Contact Info & Metadata */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lead Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Email Address</span>
                <p className="font-semibold text-slate-800 dark:text-white select-all">{lead.email || 'N/A'}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Phone Number</span>
                <p className="font-semibold text-slate-800 dark:text-white select-all">{lead.phone || 'N/A'}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Interested Course/Service</span>
                <p className="font-semibold text-crm-600 dark:text-crm-400">{lead.course || 'Not specified'}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
                <span className="text-slate-400 font-medium">Location</span>
                <p className="font-semibold text-slate-800 dark:text-white">{lead.location || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Submitted Form Fields (Meta Instant Form responses) */}
          {lead.formData && lead.formData.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <FileText size={14} className="text-crm-500" />
                <span>Submitted Meta Form Fields</span>
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 divide-y divide-slate-200 dark:divide-slate-700">
                {lead.formData.map((field, idx) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500 dark:text-slate-400">{field.label || field.field}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Campaign Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Facebook size={14} className="text-blue-500" />
              <span>Meta Ads Campaign Information</span>
              {lead.metaLeadId && (
                <button
                  type="button"
                  onClick={handleRefreshFromMeta}
                  disabled={refreshing}
                  className="ml-auto normal-case tracking-normal px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 text-[11px] font-semibold disabled:opacity-50"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh from Meta'}
                </button>
              )}
            </h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Campaign Name:</span>
                <span className="font-bold text-slate-800 dark:text-white">{lead.campaignName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ad Set Name:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{lead.adSetName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ad Creative:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{lead.adName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Created Date:</span>
                <span className="text-slate-500">{new Date(lead.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Follow-up Notes & Activity Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Notes & Follow-up Timeline
            </h3>

            {/* Note Input */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add follow-up notes, candidate feedback, call outcome..."
                rows={3}
                className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-crm-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-crm-600 to-crm-500 text-white rounded-xl text-xs font-bold shadow-md shadow-crm-600/20 hover:scale-[1.02] disabled:opacity-50 transition-all flex items-center space-x-1.5"
                >
                  <Send size={12} />
                  <span>Add Note</span>
                </button>
              </div>
            </form>

            {/* Timeline Stream */}
            <div className="space-y-2 pt-2">
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes
                  .slice()
                  .reverse()
                  .map((note, index) => (
                    <div
                      key={note._id || index}
                      className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{note.author || 'Staff'}</span>
                        <span className="text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{note.text}</p>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-slate-400 italic">No notes added to this lead yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailModal;
