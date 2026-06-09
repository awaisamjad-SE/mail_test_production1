/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('mailflow-access-token');
  });
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const profile = await api.fetchProfile();
      setUser(profile);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('Failed to load profile', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadProfile();
    } else {
      setLoading(false);
    }

    // Handle token expiration/forced logout from axios interceptor
    const handleLogoutEvent = () => {
      setUser(null);
      setIsLoggedIn(false);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [isLoggedIn]);

  const login = async (email, password) => {
    const data = await api.loginUser(email, password);
    localStorage.setItem('mailflow-access-token', data.access);
    localStorage.setItem('mailflow-refresh-token', data.refresh);
    setIsLoggedIn(true);
    await loadProfile();
  };

  const register = async (email, fullName, password, confirmPassword) => {
    await api.registerUser(email, fullName, password, confirmPassword);
  };

  const logout = () => {
    api.logoutUser();
    setUser(null);
    setIsLoggedIn(false);
  };

  const updateProfile = async (fullName, email) => {
    const updated = await api.updateProfile(fullName, email);
    setUser(updated);
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.changePassword(oldPassword, newPassword);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      loading,
      login,
      logout,
      register,
      updateProfile,
      changePassword,
      getBackendUrl: api.getBackendUrl,
      setBackendUrl: api.setBackendUrl
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
