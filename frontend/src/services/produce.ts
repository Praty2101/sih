import api from './api';

export const produceService = {
  registerProduce: (data: any) => api.post('/produce/register', data),
  getProduceLogs: () => api.get('/produce/logs'),
};


