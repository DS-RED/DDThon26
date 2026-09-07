import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { adminLogin } from '../api/endpoints.js';
import { setToken, getToken, UNAUTHORIZED_EVENT } from '../api/client.js';

const AuthContext = createContext(null);

const PROFILE_KEY = 'to.admin.profile';

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // profile: { storeId, username, storeCode }
  const [profile, setProfile] = useState(() => (getToken() ? loadProfile() : null));

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }, []);

  const login = useCallback(async ({ storeCode, username, password }) => {
    const { token, admin } = await adminLogin({ storeCode, username, password });
    setToken(token);
    const next = { storeId: admin.storeId, username: admin.username, storeCode };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
    return next;
  }, []);

  // API 계층에서 401이 오면 자동 로그아웃.
  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const value = useMemo(
    () => ({ profile, isAuthenticated: !!profile, login, logout }),
    [profile, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
