// =============================================================================
// ENHANCED ERROR BOUNDARY COMPONENT
// =============================================================================

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Settings, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { enhancedErrorHandler, ErrorContext } from '../../services/enhancedErrorHandler';

interface Props {
  children: ReactNode;
  title?: string;
  message?: string;
  fallback?: (error: Error, retry: () => void, errorContext: ErrorContext) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo, errorContext: ErrorContext) => void;
  onRetry?: (retryCount: number) => void;
  showErrorDetails?: boolean;
  enableAutoRetry?: boolean;
  maxAutoRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorContext: ErrorContext | null;
  retryCount: number;
  lastErrorTime: number;
  showDetails: boolean;
  autoRetryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private autoRetryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorContext: null,
      retryCount: 0,
      lastErrorTime: 0,
      showDetails: false,
      autoRetryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorContext = enhancedErrorHandler.handle(
      error,
      `React Component: ${this.props.title || 'Unknown'}`,
      {
        componentStack: errorInfo.componentStack,
        retryAction: this.handleRetry,
        openSettings: this.handleOpenSettings
      }
    );

    this.setState({
      error,
      errorInfo,
      errorContext,
      lastErrorTime: Date.now()
    });

    // Call parent error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorContext);
    }

    // Auto-retry for certain errors
    if (this.props.enableAutoRetry && this.shouldAutoRetry(errorContext)) {
      this.scheduleAutoRetry();
    }
  }

  shouldAutoRetry = (errorContext: ErrorContext): boolean => {
    const maxRetries = this.props.maxAutoRetries || 3;
    return (
      errorContext.canRetry &&
      errorContext.isTemporary &&
      this.state.autoRetryCount < maxRetries
    );
  };

  scheduleAutoRetry = (): void => {
    const delay = Math.min(1000 * Math.pow(2, this.state.autoRetryCount), 10000); // Max 10 seconds
    
    this.autoRetryTimer = setTimeout(() => {
      console.log(`Auto-retry attempt ${this.state.autoRetryCount + 1}`);
      this.setState(prevState => ({
        autoRetryCount: prevState.autoRetryCount + 1
      }));
      this.handleRetry();
    }, delay);
  };

  handleRetry = (): void => {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;

    // Prevent rapid retry loops (minimum 2 seconds between manual retries)
    if (timeSinceLastError < 2000 && this.state.retryCount > 0) {
      console.warn('Enhanced Error Boundary: Preventing rapid retry');
      return;
    }

    // Clear auto-retry timer
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorContext: null,
      retryCount: this.state.retryCount + 1,
      lastErrorTime: now,
      showDetails: false
    });

    // Call parent retry handler
    if (this.props.onRetry) {
      this.props.onRetry(this.state.retryCount + 1);
    }
  };

  handleOpenSettings = (): void => {
    // Dispatch custom event to open settings
    window.dispatchEvent(new CustomEvent('openSettings'));
  };

  handleDownloadLogs = (): void => {
    try {
      const logs = enhancedErrorHandler.exportErrorLogs();
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birch-lounge-error-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download error logs:', e);
    }
  };

  toggleDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  override componentWillUnmount() {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
    }
  }

  override render() {
    if (this.state.hasError && this.state.error && this.state.errorContext) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry, this.state.errorContext);
      }

      const { errorContext } = this.state;
      const isRetrying = this.autoRetryTimer !== null;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${
                errorContext.severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                errorContext.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                'bg-yellow-100 dark:bg-yellow-900'
              }`}>
                <AlertTriangle className={`w-8 h-8 ${
                  errorContext.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                  errorContext.severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                  'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {this.props.title || 'Something went wrong'}
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {errorContext.userMessage}
            </p>

            {/* Auto-retry indicator */}
            {isRetrying && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    Auto-retrying... (Attempt {this.state.autoRetryCount + 1})
                  </span>
                </div>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3 mb-6">
              {errorContext.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    action.priority === 'high'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : action.priority === 'medium'
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'
                  }`}
                  disabled={isRetrying}
                >
                  {action.icon === 'refresh' && <RefreshCw className="w-4 h-4" />}
                  {action.icon === 'key' && <Settings className="w-4 h-4" />}
                  {action.label}
                </button>
              ))}
            </div>

            {/* Additional Actions */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={this.handleDownloadLogs}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                title="Download error logs for debugging"
              >
                <Download className="w-3 h-3" />
                Download Logs
              </button>
            </div>

            {/* Error Details (Development/Debug) */}
            {(this.props.showErrorDetails || import.meta.env.DEV) && (
              <div className="text-left">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {this.state.showDetails ? 'Hide' : 'Show'} Error Details
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40">
                    <div className="space-y-2">
                      <div>
                        <strong>Error:</strong> {this.state.error.toString()}
                      </div>
                      <div>
                        <strong>Context:</strong> {errorContext.context}
                      </div>
                      <div>
                        <strong>Severity:</strong> {errorContext.severity}
                      </div>
                      <div>
                        <strong>Category:</strong> {errorContext.category}
                      </div>
                      <div>
                        <strong>Retry Count:</strong> {this.state.retryCount}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
