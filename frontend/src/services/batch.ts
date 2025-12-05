import api from './api';

export const batchService = {
  createEvent: (data: any) => api.post('/batch/event', data),
  verifyZKP: (data: any) => api.post('/zkp/verify', data),
};


