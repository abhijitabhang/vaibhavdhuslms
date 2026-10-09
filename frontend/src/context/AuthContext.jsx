import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/lmsServices';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vdlms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vdlms_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [revokedNotice, setRevokedNotice] = useState(null);

  // Synchronize authentication profile on initial mount
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          localStorage.setItem('vdlms_user', JSON.stringify(data.user));
        } catch (error) {
          if (error.code === 'SESSION_REVOKED') {
            setRevokedNotice(error.message || 'Session revoked from another device.');
          }
          logout(false);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, [token]);

  // Global event listener for session revocation
  useEffect(() => {
    const handleRevocation = (e) => {
      setRevokedNotice(e.detail?.message || 'Your account was logged in on another device.');
      logout(false);
    };

    window.addEventListener('auth:session_revoked', handleRevocation);
    return () => window.removeEventListener('auth:session_revoked', handleRevocation);
  }, []);

  const login = async (email, password, forceRevokeOthers = false) => {
    const data = await authService.login({ email, password, forceRevokeOthers });
    localStorage.setItem('vdlms_token', data.token);
    localStorage.setItem('vdlms_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setRevokedNotice(null);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    localStorage.setItem('vdlms_token', data.token);
    localStorage.setItem('vdlms_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setRevokedNotice(null);
    return data;
  };

  const logout = async (callApi = true) => {
    if (callApi && token) {
      try {
        await authService.logout();
      } catch (e) {
        // Ignored
      }
    }
    localStorage.removeItem('vdlms_token');
    localStorage.removeItem('vdlms_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isInstructor: user?.role === 'instructor' || user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
        revokedNotice,
        dismissRevokedNotice: () => setRevokedNotice(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
