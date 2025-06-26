import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginService, logout as logoutService } from '../services/auth.service';

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  token : string | null;
}

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = getCookie('user');
        if (storedUser) {
          const userData = JSON.parse(decodeURIComponent(storedUser));
          setUser(userData);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        deleteCookie('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (data: LoginData): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const response = await loginService(data);
      
      if (response) {
        const userData: User = {
          id: response.id,
          username: response.username,
          email: response.email,
          roles: response.roles
        };
        setUser(userData);
        setCookie('token', encodeURIComponent(JSON.stringify(response.token)), 7); // Cookie expires in 7 days
        setCookie('user', encodeURIComponent(JSON.stringify(userData)), 7); // Cookie expires in 7 days
        return { success: true };
      } else {
        return { success: false, message: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutService();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      deleteCookie('user');
      deleteCookie('token');
      // Clear any other stored cookies if needed
      // You might want to redirect to login page here
      window.location.href = '/signin';
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    token: getCookie('token'),
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};