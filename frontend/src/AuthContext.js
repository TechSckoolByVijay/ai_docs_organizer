/**
 * Authentication Context for managing user state and authentication
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          // Verify token is still valid
          await authAPI.verify();
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token } = response.data;
      
      // Get user details with explicit token in header
      const userResponse = await authAPI.getMeWithToken(access_token);
      const userData = userResponse.data;
      
      // Save to localStorage after successful authentication
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      // Clean up on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      console.error('Login error:', error);
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  };

  const signup = async (userData) => {
    try {
      await authAPI.signup(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Signup failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};