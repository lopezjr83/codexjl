import { createContext, useContext, useMemo, useState } from 'react';
import { request } from '../api/http';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const persistSession = (session) => {
    setToken(session.token);
    setUser(session.user);
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

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = useMemo(() => ({ token, user, login, register, refreshMe, logout, isAuthenticated: Boolean(token) }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider');
  return context;
};
