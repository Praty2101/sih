import api from './api';

export const dashboardService = {
  getFarmerBatches: () => api.get('/dashboard/farmer/batches'),
  getTransporterBatches: () => api.get('/dashboard/transporter/batches'),
  getRetailerBatches: () => api.get('/dashboard/retailer/batches'),
  getDashboardMetrics: () => api.get('/dashboard/metrics'),
};


