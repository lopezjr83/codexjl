const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const normalizeApiBase = (url) => {
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const API_BASE_URL = normalizeApiBase(rawBaseUrl);

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

  if (response.status === 401) {
    const errorBody = await response.json().catch(() => ({}));
    // Only trigger auto-logout for authenticated requests (not login/register)
    if (token && onSessionExpired) onSessionExpired();
    throw new Error(
      token
        ? 'Sesión expirada. Por favor inicia sesión de nuevo.'
        : (errorBody.message || 'Credenciales inválidas')
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error de red');
  }

  if (response.status === 204) return null;
  return response.json();
};
