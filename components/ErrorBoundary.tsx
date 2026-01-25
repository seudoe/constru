"use client";

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-stone-900">Something went wrong</h1>
            <p className="text-stone-600">Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}