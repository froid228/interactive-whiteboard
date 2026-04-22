const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function getAuthToken() {
  return localStorage.getItem('authToken');
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || 'Ошибка запроса');
  }

  return data;
}

export const authAPI = {
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request('/auth/me'),
};

export const boardsAPI = {
  getAll: () => request('/boards'),
  getById: (id) => request(`/boards/${id}`),
  create: (title) =>
    request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  update: (id, title) =>
    request(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    }),
  remove: (id) =>
    request(`/boards/${id}`, {
      method: 'DELETE',
    }),
  share: (id, email) =>
    request(`/boards/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export { API_URL, getAuthToken };
