import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const savedUser = await storage.getUser();
      const token = await storage.getToken();
      if (savedUser && token) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, referralCode) => {
    const data = await authService.register(name, email, password, referralCode);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    try {
      await storage.setUser(updatedUser);
    } catch (error) {
      console.error("Failed to save updated user to storage:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);