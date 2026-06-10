'use client';

import type { ReactNode } from 'react';
import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button, Card } from './ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// FIX #11: Error Boundary for admin pages
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: undefined, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Đã xảy ra lỗi
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                {this.state.error?.message ?? 'Không thể hiển thị nội dung này. Vui lòng thử lại.'}
              </p>
            </div>
            <Button onClick={this.handleReset} variant="outline" className="gap-2">
              <RefreshCw size={16} />
              Thử lại
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary wrapper for functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Simple error fallback component
export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error?: Error; 
  resetErrorBoundary?: () => void;
}) {
  return (
    <Card className="p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {error?.message ?? 'Đã xảy ra lỗi'}
        </p>
        {resetErrorBoundary && (
          <Button onClick={resetErrorBoundary} variant="ghost" size="sm">
            Thử lại
          </Button>
        )}
      </div>
    </Card>
  );
}
