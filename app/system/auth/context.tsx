'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface SystemAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionVerified: boolean; // True khi đã verify session xong (dù valid hay invalid)
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const SystemAuthContext = createContext<SystemAuthContextType | null>(null);

const SYSTEM_TOKEN_KEY = 'system_auth_token';

export function SystemAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {return null;}
    return localStorage.getItem(SYSTEM_TOKEN_KEY);
  });

  const loginMutation = useMutation(api.auth.verifySystemLogin);
  const logoutMutation = useMutation(api.auth.logoutSystem);
  
  // Verify session on mount and token change
  const sessionResult = useQuery(
    api.auth.verifySystemSession,
    token ? { token } : "skip"
  );

  const isLoading = Boolean(token) && sessionResult === undefined;

  // Check if session is valid
  // IsSessionVerified: true khi không có token HOẶC sessionResult đã có data (dù valid hay không)
  const isSessionVerified = !token || sessionResult !== undefined;
  const isAuthenticated = Boolean(token) && sessionResult?.valid === true;

  // Clear invalid token
  useEffect(() => {
    if (token && sessionResult && !sessionResult.valid) {
      localStorage.removeItem(SYSTEM_TOKEN_KEY);
    }
  }, [token, sessionResult]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginMutation({ email, password });
      if (result.success && result.token) {
        localStorage.setItem(SYSTEM_TOKEN_KEY, result.token);
        setToken(result.token);
      }
      return { message: result.message, success: result.success };
    } catch {
      return { message: 'Có lỗi xảy ra khi đăng nhập', success: false };
    }
  }, [loginMutation]);

  const logout = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
    }
    localStorage.removeItem(SYSTEM_TOKEN_KEY);
    setToken(null);
  }, [token, logoutMutation]);

  return (
    <SystemAuthContext.Provider value={{ isAuthenticated, isLoading, isSessionVerified, login, logout }}>
      {children}
    </SystemAuthContext.Provider>
  );
}

export function useSystemAuth() {
  const context = useContext(SystemAuthContext);
  if (!context) {
    throw new Error('useSystemAuth must be used within SystemAuthProvider');
  }
  return context;
}
