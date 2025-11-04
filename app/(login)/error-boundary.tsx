'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      // Redirect to sign-up page on error
      if (this.props.redirectTo) {
        window.location.href = this.props.redirectTo;
      } else {
        window.location.href = '/sign-up';
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Show loading state while redirecting
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

