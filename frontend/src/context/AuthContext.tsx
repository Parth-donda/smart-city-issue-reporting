import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  getDashboardRoute: (role?: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getDashboardRouteForRole = (role?: UserRole): string => {
  switch (role) {
    case 'CITIZEN':
      return '/citizen';
    case 'DEPARTMENT_OFFICER':
      return '/officer';
    case 'WORKER':
      return '/worker';
    case 'SUPERVISOR':
      return '/supervisor';
    case 'MUNICIPAL_ADMIN':
    case 'SYSTEM_ADMIN':
      return '/admin';
    default:
      return '/login';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => api.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = localStorage.getItem('smartcivic_tokens');
      if (storedTokens) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch {
          api.clearAuth();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    await api.login({ username, password });
    const userData = await api.getMe();
    setUser(userData);
    return userData;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.register(data);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    api.clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: api.getAccessToken(),
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        getDashboardRoute: (r?: UserRole) => getDashboardRouteForRole(r || user?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
