import api from './api';

export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getTrustScores: () => api.get('/admin/trust-scores'),
  getAnomalies: () => api.get('/admin/anomalies'),
};


