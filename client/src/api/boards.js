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
  getActivity: () => request('/boards/activity'),
  getById: (id) => request(`/boards/${id}`),
  create: (payload) =>
    request('/boards', {
      method: 'POST',
      body: JSON.stringify(
        typeof payload === 'string'
          ? { title: payload }
          : payload
      ),
    }),
  update: (id, payload) =>
    request(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(
        typeof payload === 'string'
          ? { title: payload }
          : payload
      ),
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
