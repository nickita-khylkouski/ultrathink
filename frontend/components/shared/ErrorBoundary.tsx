'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-panel border-2 border-danger rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-danger" />
              <h2 className="text-xl font-bold text-danger">Something Went Wrong</h2>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              An unexpected error occurred. The application encountered a problem and couldn't continue.
            </p>

            {this.state.error && (
              <div className="bg-red-900/20 border border-danger rounded p-3 mb-4">
                <p className="text-xs font-mono text-danger break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                className="flex-1"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                variant="secondary"
                className="flex-1"
              >
                Try Again
              </Button>
            </div>

            <p className="text-xs text-gray-600 mt-4 text-center">
              If the problem persists, please check the browser console for more details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
