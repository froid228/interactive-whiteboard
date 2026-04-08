import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor для добавления роли пользователя
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  config.headers['X-User-Role'] = user.role || 'user';
  config.headers['X-User-Id'] = user.id || 1;
  return config;
});

export const boardsAPI = {
  create: async (title) => {
    const { data } = await api.post('/boards', { title });
    return data;
  },
  getAll: async () => {
    const { data } = await api.get('/boards');
    return data;
  },
  update: async (id, title) => {
    const { data } = await api.put(`/boards/${id}`, { title });
    return data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/boards/${id}`);
    return data;
  },
};

export default api;