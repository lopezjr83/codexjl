const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const normalizeApiBase = (url) => {
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE_URL = normalizeApiBase(rawBaseUrl);

// Callback to call when session expires — set by AuthProvider
let onSessionExpired = null;
export const setSessionExpiredHandler = (fn) => { onSessionExpired = fn; };

export const request = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  // Session expired — auto logout with clear message
  if (response.status === 401) {
    if (onSessionExpired) onSessionExpired();
    throw new Error('Sesión expirada. Por favor inicia sesión de nuevo.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error de red');
  }

  if (response.status === 204) return null;
  return response.json();
};
