import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const normalizeRole = (role) => {
  if (!role) return 'Employee';
  const value = String(role).trim().toLowerCase();
  if (value === 'asset manager' || value === 'assetmanager') return 'AssetManager';
  if (value === 'department head' || value === 'departmenthead') return 'DepartmentHead';
  return role;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        setToken(storedToken);
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session restoration failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password, rememberMe) => {
    try {
      const res = await api.post('/auth/login', { email, password, rememberMe });

      if (res.data && res.data.success) {
        const { token: userToken, user: userData } = res.data;

        if (rememberMe) {
          localStorage.setItem('token', userToken);
        } else {
          sessionStorage.setItem('token', userToken);
        }

        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });

      if (res.data && res.data.success) {
        const { token: userToken, user: userData } = res.data;
        sessionStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const normalizedUserRole = normalizeRole(user.role);
    return roles.some((role) => normalizeRole(role) === normalizedUserRole);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        token,
        loading,
        login,
        signup,
        logout,
        hasRole
      }}
    >
      {children}
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

export default AuthContext;
