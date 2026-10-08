import React, { useState, useEffect } from 'react';
import { staffService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserPlus, Shield, Phone, Mail, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { isAdmin } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await staffService.getStaff();
      setStaff(res.staff);
    } catch (err) {
      console.error('Error fetching staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    setPageError('');
    try {
      await staffService.toggleStatus(id, nextStatus);
      fetchStaff();
    } catch (err) {
      setPageError(err.response?.data?.message || 'Could not update account status');
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await staffService.addStaff(formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'staff' });
      fetchStaff();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add staff member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-crm-500" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage admin & sales staff access, lead assignments, and account permissions
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-crm-600 to-crm-500 hover:from-crm-700 hover:to-crm-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-crm-600/20 flex items-center space-x-2 transition-all self-start"
          >
            <UserPlus size={16} />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {pageError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{pageError}</div>
      )}

      {/* Staff Cards Roster */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-crm-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member._id || member.id}
              className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl shadow-crm-card dark:shadow-crm-dark-card space-y-4 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-extrabold text-base flex items-center justify-center">
                    {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</h3>
                    <span className="text-[11px] text-slate-400 block">{member.email}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                    member.role === 'admin'
                      ? 'bg-crm-100 text-crm-700 dark:bg-crm-950 dark:text-crm-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {member.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Leads</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {member.assignedLeadsCount || 0}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Converted</span>
                  <span className="text-base font-extrabold text-emerald-500">
                    {member.convertedLeadsCount || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">Account Status:</span>
                {isAdmin ? (
                  <button
                    onClick={() => handleToggleStatus(member._id, member.status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {member.status === 'active' ? 'Active' : 'Disabled'}
                  </button>
                ) : (
                  <span className={`font-bold capitalize ${member.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>{member.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl">{modalError}</div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="staff">Staff / Sales Representative</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-crm-600 to-crm-500 text-white font-bold rounded-xl shadow-md"
                >
                  {submitting ? 'Creating...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
