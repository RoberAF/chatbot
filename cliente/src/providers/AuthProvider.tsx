'use client';

import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  accessToken: string | null;
  
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name?: string, age?: number) => Promise<any>;
  logout: () => Promise<void>;

  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    accessToken,
    loading,
    error,
    login,
    register,
    logout,
    authFetch
  } = useAuth();
  
  const isAuthenticated = Boolean(accessToken);
  
  const value = {
    isAuthenticated,
    loading,
    error,
    accessToken,
    login,
    register,
    logout,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}