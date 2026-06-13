import { useState, useEffect, useRef } from 'react';
import { authService } from '../services/mockAuthService';
import { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON } from '../utils/storage.js';
import { STORAGE_KEYS, SESSION_TIMEOUT_MINUTES } from '../config/securityConfig.js';
import { AuthContext } from './authContextImpl';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved token on mount
    const token = safeGetItem(STORAGE_KEYS.TOKEN);
    const savedUserRaw = safeGetItem(STORAGE_KEYS.USER);
    const savedUser = safeParseJSON(savedUserRaw, null);

    if (token && savedUser) {
      setUser(savedUser);
    } else {
      // Clean up any inconsistent state
      safeRemoveItem(STORAGE_KEYS.TOKEN);
      safeRemoveItem(STORAGE_KEYS.USER);
    }
    setLoading(false);
  }, []);

  // Session timeout handling: logout after inactivity
  const timeoutRef = useRef(null);

  useEffect(() => {
    const logoutAfterTimeout = () => {
      // Secure logout action
      setUser(null);
      safeRemoveItem(STORAGE_KEYS.TOKEN);
      safeRemoveItem(STORAGE_KEYS.USER);
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // convert minutes to ms, fallback to 30 minutes
      const ms = (Number(SESSION_TIMEOUT_MINUTES) || 30) * 60 * 1000;
      timeoutRef.current = setTimeout(() => {
        logoutAfterTimeout();
      }, ms);
    };

    // Start timer only when user is authenticated
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

  const login = async (email, password, rememberMe) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    if (rememberMe) {
      safeSetItem(STORAGE_KEYS.TOKEN, response.token);
      safeSetItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    }
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authService.register(name, email, password);
    setUser(response.user);
    // Auto login on register
    safeSetItem(STORAGE_KEYS.TOKEN, response.token);
    safeSetItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
    return response;
  };

  const logout = () => {
    setUser(null);
    safeRemoveItem(STORAGE_KEYS.TOKEN);
    safeRemoveItem(STORAGE_KEYS.USER);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// `useAuth` moved to `src/context/useAuth.js` to keep this file exporting only components.
