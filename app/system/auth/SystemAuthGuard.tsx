'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSystemAuth } from './context';

export function SystemAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isSessionVerified } = useSystemAuth();

  // Redirect to login if not authenticated (useEffect to avoid setState during render)
  // CHỈ redirect khi đã verify session xong (isSessionVerified = true)
  useEffect(() => {
    if (!isLoading && isSessionVerified && !isAuthenticated && pathname !== '/system/auth/login') {
      router.push('/system/auth/login');
    }
  }, [isLoading, isSessionVerified, isAuthenticated, pathname, router]);

  // Skip guard for login page
  if (pathname === '/system/auth/login') {
    return <>{children}</>;
  }

  // Show loading while checking auth or waiting for session verification
  if (isLoading || !isSessionVerified || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
