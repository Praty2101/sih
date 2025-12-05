import api from './api';

export const registrationService = {
  registerFarmer: (data: any) => api.post('/register/farmer', data),
  registerTransporter: (data: any) => api.post('/register/transporter', data),
  registerRetailer: (data: any) => api.post('/register/retailer', data),
  registerConsumer: (data: any) => api.post('/register/consumer', data),
};


