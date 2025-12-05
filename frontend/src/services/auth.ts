import api from './api';

export const authService = {
  login: async (identifier: string, password: string, role?: string) => {
    const res = await api.post('/login', { identifier, password, role });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getMe: async () => {
    const res = await api.get('/me');
    return res.data;
  },
};


