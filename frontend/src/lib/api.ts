import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lendx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authApi = {
  register: (data: { email: string; password: string; role: string; full_name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Profile
export const profileApi = {
  create: (data: any) => api.post('/profile', data),
  get: (userId: string) => api.get(`/profile/${userId}`),
  update: (userId: string, data: any) => api.put(`/profile/${userId}`, data),
};

// Alt-data
export const dataApi = {
  connectUpi: () => api.post('/data/upi'),
  connectUtility: () => api.post('/data/utility'),
  connectGst: () => api.post('/data/gst'),
  connectSocialVouch: () => api.post('/data/social-vouch'),
  getSources: (userId: string) => api.get(`/data/${userId}`),
};

// Score
export const scoreApi = {
  calculate: () => api.post('/score/calculate'),
  get: (userId: string) => api.get(`/score/${userId}`),
  getBreakdown: (userId: string) => api.get(`/score/${userId}/breakdown`),
  getHistory: (userId: string) => api.get(`/score/${userId}/history`),
};

// Loans
export const loanApi = {
  apply: (data: { amount: number; tenure_months: number; purpose: string }) =>
    api.post('/loans/apply', data),
  get: (loanId: string) => api.get(`/loans/${loanId}`),
  getUserLoans: (userId: string) => api.get(`/loans/user/${userId}`),
  updateStatus: (loanId: string, status: string) => api.put(`/loans/${loanId}/status`, { status }),
  disburse: (loanId: string, data?: { payment_method?: string }) => api.post(`/loans/${loanId}/disburse`, data),
};

// Repayments
export const repaymentApi = {
  pay: (repaymentId: string) => api.post('/repayments', { repayment_id: repaymentId }),
  getByLoan: (loanId: string) => api.get(`/repayments/${loanId}`),
  getSchedule: (loanId: string) => api.get(`/repayments/schedule/${loanId}`),
};

// Vouching
export const vouchApi = {
  submit: (data: { vouchee_id: string; note?: string }) => api.post('/vouch', data),
  getReceived: (userId: string) => api.get(`/vouch/${userId}`),
  getGiven: (userId: string) => api.get(`/vouch/given/${userId}`),
  searchBorrowers: (email: string) => api.get(`/vouch/search/borrowers?email=${email}`),
};

// Admin
export const adminApi = {
  getLoans: () => api.get('/admin/loans'),
  getBorrowers: () => api.get('/admin/borrowers'),
  getAnalytics: () => api.get('/admin/analytics'),
};

// Payments (mock gateway)
export const paymentApi = {
  create: (data: {
    loan_id: string;
    repayment_id?: string;
    payment_type: 'repayment' | 'disbursement';
    amount: number;
    payment_method: string;
  }) => api.post('/payments/create', data),
  verify: (payment_id: string, action: 'success' | 'cancel') =>
    api.post('/payments/verify', { payment_id, action }),
  disburse: (data: {
    loanId: string;
    paymentMethod: string;
    paymentDetails?: any;
  }) => api.post('/payments/disburse', data),
  getByLoan: (loanId: string) => api.get(`/payments/${loanId}`),
  getHistory: () => api.get('/payments/history'),
};

