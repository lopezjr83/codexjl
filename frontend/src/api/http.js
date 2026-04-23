const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const normalizeApiBase = (url) => {
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE_URL = normalizeApiBase(rawBaseUrl);

export const request = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error de red');
  }

  if (response.status === 204) return null;
  return response.json();
};
