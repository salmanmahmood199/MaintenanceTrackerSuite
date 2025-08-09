import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '../services/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: number;
  maintenanceVendorId?: number;
  permissions?: string[];
  vendorTiers?: string[];
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a stored token first
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) {
        setUser(null);
        return;
      }
      
      const response = await apiRequest('GET', '/api/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If auth fails, clear stored token
        await AsyncStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear token on error
      await AsyncStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const responseData = await response.json();
      
      // Handle different response formats
      const userData = responseData.user || responseData;
      
      // Store token if provided
      if (responseData.token) {
        await AsyncStorage.setItem('authToken', responseData.token);
      } else {
        // For cookie-based auth, store a flag
        await AsyncStorage.setItem('authToken', 'cookie-based');
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored token
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      router.replace('/');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    logout,
    checkAuthStatus,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}