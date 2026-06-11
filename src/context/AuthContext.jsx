import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/mockAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved token on mount
    const token = localStorage.getItem('eco_token');
    const savedUser = localStorage.getItem('eco_user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('eco_token');
        localStorage.removeItem('eco_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    if (rememberMe) {
      localStorage.setItem('eco_token', response.token);
      localStorage.setItem('eco_user', JSON.stringify(response.user));
    }
    return response;
  };

  const register = async (name, email, password) => {
    const response = await authService.register(name, email, password);
    setUser(response.user);
    // Auto login on register
    localStorage.setItem('eco_token', response.token);
    localStorage.setItem('eco_user', JSON.stringify(response.user));
    return response;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eco_token');
    localStorage.removeItem('eco_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
