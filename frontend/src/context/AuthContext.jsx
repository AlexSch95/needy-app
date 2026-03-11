import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.getMe()
        .then((data) => {
          setUser({
            id: data.id,
            username: data.username,
            displayName: data.displayName,
            profileImage: data.profileImage,
            gender: data.gender,
            phoneNumber: data.phoneNumber,
            bio: data.bio,
            fivemUuid: data.fivemUuid,
          });
          setIsProfileComplete(data.isProfileComplete);
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setIsProfileComplete(data.isProfileComplete);
    return data;
  }, []);

  const register = useCallback(async (username, password, fivemToken) => {
    const data = await api.register(username, password, fivemToken);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setIsProfileComplete(data.isProfileComplete);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsProfileComplete(false);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
    if (updates.isProfileComplete !== undefined) {
      setIsProfileComplete(updates.isProfileComplete);
    }
  }, []);

  const setProfileComplete = useCallback(() => {
    setIsProfileComplete(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isProfileComplete,
        loading,
        login,
        register,
        logout,
        updateUser,
        setProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
