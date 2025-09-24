 
import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

/**
 * Error Boundary component to catch and handle React component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with context
    const errorContext = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      componentStack: errorInfo.componentStack
    };

    console.error('ErrorBoundary caught an error:', errorContext);

    this.setState({
      error,
      errorInfo
    });

    // Enhanced error reporting
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorContext);
    }

    // Optional: Send to error reporting service
    this.reportError(errorContext);
  }

  reportError = (errorContext) => {
    // This could be enhanced to send to Sentry, LogRocket, etc.
    try {
      // Store error in localStorage for debugging
      const errors = JSON.parse(localStorage.getItem('birch-lounge-errors') || '[]');
      errors.push(errorContext);
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      localStorage.setItem('birch-lounge-errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  };

  handleReset = () => {
    const now = Date.now();
    const timeSinceLastError = now - (this.state.lastErrorTime || 0);

    // Prevent rapid retry loops (minimum 5 seconds between retries)
    if (timeSinceLastError < 5000 && this.state.retryCount > 0) {
      console.warn('Error boundary: Preventing rapid retry');
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
      lastErrorTime: now
    });

    // Optional: Call parent retry handler
    if (this.props.onRetry) {
      this.props.onRetry(this.state.retryCount + 1);
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {this.props.message ||
                'An unexpected error occurred. Please try refreshing or contact support if the problem persists.'}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                aria-label="Try again"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              {import.meta.env?.DEV && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Show Error Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utility functions moved to src/utils/errorBoundaryUtils.js
// to avoid React Fast Refresh issues

export default ErrorBoundary;
