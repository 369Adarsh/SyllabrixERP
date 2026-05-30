import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuth = (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    setTenant(data.tenant);
  };

  const clearAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setTenant(null);
  };

  const register = async (formData) => {
    const { data } = await authApi.register(formData);
    if (!data.data?.requiresVerification) {
      setAuth(data.data);
    }
    return data;
  };

  const login = async (formData) => {
    const { data } = await authApi.login(formData);
    setAuth(data.data);
    return data;
  };

  const staffLogin = async (formData) => {
    const { data } = await authApi.staffLogin(formData);
    setAuth(data.data);
    return data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
  };

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authApi.getMe();
      setUser(data.data.user);
      setTenant(data.data.tenant);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  return (
    <AuthContext.Provider value={{ user, tenant, loading, register, login, staffLogin, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
