import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for token expiry
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired - will be handled by auth context
      console.warn('[API] Session expired');
    }
    return Promise.reject(err);
  },
);

// --- Auth ---
export async function loginAPI(email: string, password: string) {
  const res = await api.post('/api/auth/login', { email, password });
  return res.data;
}

export async function registerAPI(name: string, email: string, password: string, profile: string) {
  const res = await api.post('/api/auth/register', {
    name_user: name,
    email,
    password,
    user_profile: profile,
  });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/api/auth/me');
  return res.data;
}

// --- RDO ---
export interface RDOInput {
  id_work: string;
  rdo_date: string;
  service?: string;
  team?: string;
  content: string;
  shift?: string;
  weather?: string;
  photos?: { url: string; latitude?: number; longitude?: number; tags?: string[] }[];
}

export async function createRDO(data: RDOInput) {
  const res = await api.post('/api/rdo', data);
  return res.data;
}

export async function getRDO(id: string) {
  const res = await api.get(`/api/rdo/${id}`);
  return res.data;
}

export async function listRDO(params?: { id_work?: string; status?: string; start?: string; end?: string }) {
  const res = await api.get('/api/rdo', { params });
  return res.data;
}

export async function approveRDO(id: string, data: {
  approved_by: string;
  engineer_notes?: string;
  confirmed_review: true;
}) {
  const res = await api.patch(`/api/rdo/${id}/approve`, data);
  return res.data;
}

export async function getRDOAudit(id: string) {
  const res = await api.get(`/api/rdo/${id}`);
  return res.data;
}

export async function getRDOPDF(id: string) {
  const res = await api.get(`/api/rdo/${id}/pdf`, {
    responseType: 'blob',
    timeout: 30000,
  });
  return res.data;
}

export async function exportRDOCSV(params?: { start?: string; end?: string; id_work?: string }) {
  const res = await api.get('/api/rdo/export/csv', {
    params,
    responseType: 'blob',
  });
  return res.data;
}
