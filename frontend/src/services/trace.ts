import api from './api';

export const traceService = {
  traceBatch: (batchId: string) => api.get(`/trace/${batchId}`),
  getGPS: (deviceId: string) => api.get(`/gps/${deviceId}`),
  getIdentity: (did: string) => api.get(`/identity/${did}`),
};


