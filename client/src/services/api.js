import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('meta_crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('meta_crm_token');
      localStorage.removeItem('meta_crm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Lead Services
export const leadService = {
  getLeads: async (params) => {
    const res = await api.get('/leads', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/leads/stats');
    return res.data;
  },
  getLeadById: async (id) => {
    const res = await api.get(`/leads/${id}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.patch(`/leads/${id}/status`, { status });
    return res.data;
  },
  assignLead: async (id, staffId) => {
    const res = await api.patch(`/leads/${id}/assign`, { staffId });
    return res.data;
  },
  addNote: async (id, text) => {
    const res = await api.post(`/leads/${id}/notes`, { text });
    return res.data;
  },
  scheduleFollowUp: async (id, followUpDate) => {
    const res = await api.patch(`/leads/${id}/followup`, { followUpDate });
    return res.data;
  },
  createLead: async (data) => {
    const res = await api.post('/leads', data);
    return res.data;
  },
  batchImport: async (leads) => {
    const res = await api.post('/leads/batch', { leads });
    return res.data;
  },
  getFilterOptions: async () => {
    const res = await api.get('/leads/filters');
    return res.data;
  },
  getCampaignStats: async () => {
    const res = await api.get('/leads/campaigns');
    return res.data;
  },
  exportLeads: async (params = {}) => {
    const res = await api.get('/leads/export', { params });
    return res.data;
  },
};

// Meta Integration Services
export const metaService = {
  getConfig: async () => {
    const res = await api.get('/meta/config');
    return res.data;
  },
  refreshLead: async (id) => {
    const res = await api.post(`/meta/leads/${id}/refresh`);
    return res.data;
  },
};

// Staff Services
export const staffService = {
  getStaff: async () => {
    const res = await api.get('/staff');
    return res.data;
  },
  addStaff: async (staffData) => {
    const res = await api.post('/staff', staffData);
    return res.data;
  },
  updateStaff: async (id, staffData) => {
    const res = await api.put(`/staff/${id}`, staffData);
    return res.data;
  },
  toggleStatus: async (id, status) => {
    const res = await api.patch(`/staff/${id}/status`, { status });
    return res.data;
  },
};

export default api;
