import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('nexflow_user') || 'null')
  );
  const [tokens, setTokens] = useState(() =>
    JSON.parse(localStorage.getItem('nexflow_tokens') || 'null')
  );
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!tokens?.access_token;

  useEffect(() => {
    if (tokens?.access_token && !user) {
      authApi
        .me()
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem('nexflow_user', JSON.stringify(data));
        })
        .catch(() => {
          setTokens(null);
          localStorage.removeItem('nexflow_tokens');
          localStorage.removeItem('nexflow_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setTokens(data);
    localStorage.setItem('nexflow_tokens', JSON.stringify(data));
    const { data: userData } = await authApi.me();
    setUser(userData);
    localStorage.setItem('nexflow_user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (email, password, display_name) => {
    await authApi.register({ email, password, display_name });
    return login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    try {
      if (tokens?.refresh_token) {
        await authApi.logout({ refresh_token: tokens.refresh_token });
      }
    } catch {}
    setUser(null);
    setTokens(null);
    localStorage.removeItem('nexflow_tokens');
    localStorage.removeItem('nexflow_user');
  }, [tokens]);

  return (
    <AuthContext.Provider value={{ user, tokens, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
