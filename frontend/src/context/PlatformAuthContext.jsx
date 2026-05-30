import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { saLogin, saGetMe } from '../api/platform';

const PlatformAuthContext = createContext(null);

export const PlatformAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const { data } = await saLogin({ email, password });
    localStorage.setItem('saToken', data.data.token);
    setAdmin(data.data.admin);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('saToken');
    setAdmin(null);
  };

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem('saToken');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await saGetMe();
      setAdmin(data.data);
    } catch {
      localStorage.removeItem('saToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  return (
    <PlatformAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  return ctx;
};
