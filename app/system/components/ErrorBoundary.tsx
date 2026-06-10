'use client';

import type { ReactNode } from 'react';
import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// SYS-007: Error Boundary for system pages
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SystemErrorBoundary caught an error:', error, errorInfo);
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Đã xảy ra lỗi
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                {this.state.error?.message ?? 'Không thể hiển thị nội dung này. Vui lòng thử lại.'}
              </p>
            </div>
            <button 
              onClick={this.handleReset} 
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={16} />
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
