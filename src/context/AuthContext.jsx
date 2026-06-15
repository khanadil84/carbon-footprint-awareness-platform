import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { authService } from '../services/mockAuthService';
import { safeGetItem, safeSetItem, safeRemoveItem, safeGetJSON, safeSetJSON } from '../utils/storage.js';
import { STORAGE_KEYS, SESSION_TIMEOUT_MINUTES } from '../config/securityConfig.js';
import { AuthContext } from './authContextImpl';

const TOKEN_KEY = STORAGE_KEYS.TOKEN;
const USER_KEY = STORAGE_KEYS.USER;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeGetItem(TOKEN_KEY);
    const savedUser = safeGetJSON(USER_KEY, null);

    if (token && savedUser) {
      setUser(savedUser);
    } else {
      safeRemoveItem(TOKEN_KEY);
      safeRemoveItem(USER_KEY);
    }
    setLoading(false);
  }, []);

  const timeoutRef = useRef(null);

  useEffect(() => {
    const logoutAfterTimeout = () => {
      setUser(null);
      safeRemoveItem(TOKEN_KEY);
      safeRemoveItem(USER_KEY);
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const ms = (Number(SESSION_TIMEOUT_MINUTES) || 30) * 60 * 1000;
      timeoutRef.current = setTimeout(() => {
        logoutAfterTimeout();
      }, ms);
    };

    const activityEvents = ['mousemove','keydown','click','touchstart'];
    if (user) {
      activityEvents.forEach(ev => window.addEventListener(ev, resetTimer));
      resetTimer();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      activityEvents.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [user]);

  const login = useCallback(async (email, password, rememberMe) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    if (rememberMe) {
      safeSetItem(TOKEN_KEY, response.token);
      safeSetJSON(USER_KEY, response.user);
    }
    return response;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const response = await authService.register(name, email, password);
    setUser(response.user);
    safeSetItem(TOKEN_KEY, response.token);
    safeSetJSON(USER_KEY, response.user);
    return response;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    safeRemoveItem(TOKEN_KEY);
    safeRemoveItem(USER_KEY);
  }, []);

  return (
    <AuthContext.Provider value={useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
