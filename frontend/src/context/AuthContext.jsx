import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    
    if (currentUser) {
      // Check if token is expired on load
      const isExpired = checkTokenExpiration(currentUser.token);
      
      if (isExpired) {
        console.log('Token expired on load - clearing');
        localStorage.removeItem('user');
      } else {
        setUser(currentUser);
      }
    }
    
    setLoading(false);
  }, []);

  // Check token expiration every minute
  useEffect(() => {
    if (!user) return;

    const checkInterval = setInterval(() => {
      const currentUser = authService.getCurrentUser();
      
      if (currentUser && currentUser.token) {
        const isExpired = checkTokenExpiration(currentUser.token);
        
        if (isExpired) {
          console.log('Token expired - auto logout');
          logout();
          window.location.href = '/login';
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [user]);

  const checkTokenExpiration = (token) => {
    try {
      // Decode JWT payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      return currentTime >= expirationTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.data);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.data);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isCandidate: user?.user?.role === 'CANDIDATE',
    isEmployer: user?.user?.role === 'EMPLOYER',
    isAdmin: user?.user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};