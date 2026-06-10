'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface AdminUser {
  avatar?: string;
  id: string;
  name: string;
  email: string;
  roleId: string;
  isSuperAdmin: boolean;
  permissions: Record<string, string[]>;
  trial?: {
    createdAt: number | null;
    durationDays: 1 | 7 | 30 | 90 | null;
    expiresAt: number;
    remainingMs: number;
  };
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionVerified: boolean; // True khi đã verify session xong (dù valid hay invalid)
  token: string | null;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasPermission: (moduleKey: string, action: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const ADMIN_TOKEN_KEY = 'admin_auth_token';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') {return null;}
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  });

  const loginMutation = useMutation(api.auth.verifyAdminLogin);
  const logoutMutation = useMutation(api.auth.logoutAdmin);
  const cleanupExpiredTrialByToken = useMutation(api.auth.cleanupExpiredAdminTrialByToken);
  
  // Verify session on mount and token change
  const sessionResult = useQuery(
    api.auth.verifyAdminSession,
    token ? { token } : "skip"
  );

  const permissionMode = useQuery(api.settings.getValue, {
    defaultValue: 'rbac',
    key: 'admin_permission_mode',
  });

  const activeToken = sessionResult?.valid === false ? null : token;

  // Check if session is valid
  // IsSessionVerified: true khi không có token HOẶC sessionResult đã có data (dù valid hay không)
  const isSessionVerified = !activeToken || sessionResult !== undefined;
  const isAuthenticated = Boolean(activeToken) && sessionResult?.valid === true;
  const isLoading = Boolean(activeToken) && sessionResult === undefined;
  const user = sessionResult?.user ? {
    avatar: sessionResult.user.avatar,
    email: sessionResult.user.email,
    id: sessionResult.user.id,
    isSuperAdmin: sessionResult.user.isSuperAdmin,
    name: sessionResult.user.name,
    permissions: sessionResult.user.permissions,
    roleId: sessionResult.user.roleId,
    trial: sessionResult.user.trial,
  } : null;

  // Clear invalid token
  useEffect(() => {
    if (token && sessionResult && !sessionResult.valid) {
      void cleanupExpiredTrialByToken({ token }).finally(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken(null);
      });
    }
  }, [cleanupExpiredTrialByToken, token, sessionResult]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginMutation({ email, password });
      if (result.success && result.token) {
        localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
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
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  }, [token, logoutMutation]);

  const hasPermission = (moduleKey: string, action: string) => {
    if (!user) {return false;}
    if (permissionMode === 'simple_full_admin') {return true;}
    if (user.isSuperAdmin) {return true;}
    
    const {permissions} = user;
    
    // Check wildcard
    if (permissions["*"]?.includes("*") || permissions["*"]?.includes(action)) {
      return true;
    }
    
    // Check module-specific permission
    if (permissions[moduleKey]?.includes("*") || permissions[moduleKey]?.includes(action)) {
      return true;
    }
    
    return false;
  };

  return (
    <AdminAuthContext.Provider value={{ hasPermission, isAuthenticated, isLoading, isSessionVerified, login, logout, token: activeToken, user }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
