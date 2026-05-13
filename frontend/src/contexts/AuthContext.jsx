import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { request, setSessionExpiredHandler } from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [sessionMsg, setSessionMsg] = useState('');

  const logout = (msg = '') => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (msg) setSessionMsg(msg);
  };

  // Register the 401 handler so http.js can trigger auto-logout
  useEffect(() => {
    setSessionExpiredHandler(() => logout('Tu sesión ha expirado. Por favor inicia sesión de nuevo.'));
    return () => setSessionExpiredHandler(null);
  }, []);

  const persistSession = (session) => {
    setToken(session.token);
    setUser(session.user);
    setSessionMsg('');
    localStorage.setItem('token', session.token);
    localStorage.setItem('user', JSON.stringify(session.user));
  };

  const login = async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    persistSession(data);
  };

  const register = async (payload) => {
    const data = await request('/auth/register', { method: 'POST', body: payload });
    persistSession(data);
  };

  const refreshMe = async () => {
    if (!token) return;
    const data = await request('/auth/me', { token });
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const value = useMemo(
    () => ({ token, user, login, register, refreshMe, logout, sessionMsg, isAuthenticated: Boolean(token) }),
    [token, user, sessionMsg]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
};
