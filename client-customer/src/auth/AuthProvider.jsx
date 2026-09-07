import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { loginTable } from '../api/auth.js';
import { ApiError, request } from '../api/client.js';
import { readSetup, SETUP_KEY, writeStorage } from '../storage/customer-storage.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSetup);
  const [storageError, setStorageError] = useState(false);
  const current = useRef(session);
  const generation = useRef(0);
  const lifetime = useRef(new AbortController());
  const refresh = useRef(null);
  useEffect(() => { lifetime.current = new AbortController(); return () => lifetime.current.abort(); }, []);
  const install = useCallback((next) => {
    current.current = next; setSession(next);
    setStorageError(!writeStorage(SETUP_KEY, next));
  }, []);
  const signIn = useCallback(async (credentials, signal) => {
    const version = ++generation.current;
    const result = await loginTable(credentials, signal);
    if (version !== generation.current || signal?.aborted) return;
    lifetime.current.abort(); lifetime.current = new AbortController();
    install({ ...result, credentials });
  }, [install]);
  const reset = useCallback(() => {
    ++generation.current; lifetime.current.abort(); lifetime.current = new AbortController();
    refresh.current = null; install(null);
  }, [install]);
  const renew = useCallback(async () => {
    if (refresh.current) return refresh.current;
    const previous = current.current;
    if (!previous) throw new ApiError('테이블 설정이 필요합니다.', 401);
    const version = generation.current;
    const pending = loginTable(previous.credentials, lifetime.current.signal).then((result) => {
      if (version !== generation.current) throw new DOMException('Aborted', 'AbortError');
      const next = { ...result, credentials: previous.credentials }; install(next); return next;
    }).catch((error) => {
      if (version === generation.current && error.status === 401) reset();
      throw error;
    }).finally(() => { if (refresh.current === pending) refresh.current = null; });
    refresh.current = pending; return pending;
  }, [install, reset]);
  const authenticatedRequest = useCallback(async (path, options = {}) => {
    const previous = current.current;
    if (!previous) throw new ApiError('테이블 설정이 필요합니다.', 401);
    const signal = options.signal ? AbortSignal.any([options.signal, lifetime.current.signal]) : lifetime.current.signal;
    try { return await request(path, { ...options, token: previous.token, signal }); }
    catch (error) {
      if (error.status !== 401 || signal.aborted) throw error;
      const next = current.current?.token !== previous.token ? current.current : await renew();
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (options.method && options.method !== 'GET') throw new ApiError('로그인을 갱신했습니다. 주문 내용을 확인하고 다시 확정해 주세요.', 401);
      return request(path, { ...options, token: next.token, signal });
    }
  }, [renew]);
  return <AuthContext.Provider value={{ session, storageError, signIn, reset, authenticatedRequest }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
