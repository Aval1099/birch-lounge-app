// =============================================================================
// ENHANCED ERROR HANDLING SERVICE
// =============================================================================

/**
 * Enhanced Error Handling Service with comprehensive error management,
 * user-friendly messaging, and automatic recovery mechanisms.
 */

export interface ErrorContext {
  timestamp: string;
  context: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'auth' | 'system' | 'user' | 'ai' | 'configuration';
  recoveryActions: RecoveryAction[];
  canRetry: boolean;
  isTemporary: boolean;
  metadata: ErrorMetadata;
}

export interface RecoveryAction {
  type: string;
  label: string;
  description: string;
  action: () => void | Promise<void>;
  priority: 'high' | 'medium' | 'low';
  icon?: string;
}

export interface ErrorMetadata {
  errorCode?: string;
  statusCode?: number;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: ErrorContext[];
  errorTrends: Array<{ timestamp: string; count: number }>;
}

class EnhancedErrorHandler {
  private errorQueue: ErrorContext[] = [];
  private errorStats: ErrorStats = {
    totalErrors: 0,
    errorsByCategory: {},
    errorsBySeverity: {},
    recentErrors: [],
    errorTrends: []
  };
  private maxQueueSize = 100;
  private maxRecentErrors = 20;
  private errorListeners: Array<(error: ErrorContext) => void> = [];

  /**
   * Handle and process errors with enhanced context and recovery
   */
  handle(error: Error | string, context: string = 'Unknown', options: any = {}): ErrorContext {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const errorContext: ErrorContext = {
      timestamp: new Date().toISOString(),
      context,
      message: errorObj.message || 'An unexpected error occurred',
      userMessage: this.generateUserMessage(errorObj, context),
      severity: this.determineSeverity(errorObj, context),
      category: this.categorizeError(errorObj, context),
      recoveryActions: this.generateRecoveryActions(errorObj, context, options),
      canRetry: this.canRetry(errorObj, context),
      isTemporary: this.isTemporary(errorObj),
      metadata: this.collectMetadata(errorObj, options)
    };

    // Track error statistics
    this.trackError(errorContext);

    // Log error appropriately
    this.logError(errorContext);

    // Notify listeners
    this.notifyListeners(errorContext);

    // Auto-recovery for certain errors
    this.attemptAutoRecovery(errorContext);

    return errorContext;
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(error: Error, context: string): string {
    const message = error.message?.toLowerCase() || '';

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'Connection issue detected. Please check your internet connection and try again.';
    }

    // API key errors
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'Authentication issue. Please check your API key configuration in Settings.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Please check your input and try again. Some required information may be missing or incorrect.';
    }

    // AI service errors
    if (context.includes('AI') || context.includes('Gemini')) {
      return 'AI service is temporarily unavailable. Please try again in a moment.';
    }

    // PDF processing errors
    if (context.includes('PDF') || message.includes('pdf')) {
      return 'Unable to process the PDF file. Please ensure it\'s a valid PDF and try again.';
    }

    // Storage errors
    if (message.includes('storage') || message.includes('quota')) {
      return 'Storage limit reached. Please free up some space and try again.';
    }

    // Generic fallback
    return 'Something went wrong. Please try again or refresh the page if the problem persists.';
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, context: string): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message?.toLowerCase() || '';

    // Critical errors
    if (message.includes('security') || message.includes('corruption') || context.includes('Auth')) {
      return 'critical';
    }

    // High severity
    if (message.includes('api key') || message.includes('unauthorized') || message.includes('storage')) {
      return 'high';
    }

    // Medium severity
    if (message.includes('network') || message.includes('timeout') || context.includes('AI')) {
      return 'medium';
    }

    // Low severity (validation, UI issues)
    return 'low';
  }

  /**
   * Categorize errors for better handling
   */
  private categorizeError(error: Error, context: string): ErrorContext['category'] {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }

    if (message.includes('api key') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }

    if (context.includes('AI') || context.includes('Gemini')) {
      return 'ai';
    }

    if (message.includes('configuration') || message.includes('config')) {
      return 'configuration';
    }

    if (message.includes('storage') || message.includes('quota') || message.includes('memory')) {
      return 'system';
    }

    return 'user';
  }

  /**
   * Generate contextual recovery actions
   */
  private generateRecoveryActions(error: Error, context: string, options: any): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    const category = this.categorizeError(error, context);

    switch (category) {
      case 'network':
        actions.push({
          type: 'retry',
          label: 'Try Again',
          description: 'Retry the operation',
          action: options.retryAction || (() => window.location.reload()),
          priority: 'high',
          icon: 'refresh'
        });
        break;

      case 'auth':
        actions.push({
          type: 'configure_api_key',
          label: 'Check API Key',
          description: 'Verify your API key configuration',
          action: options.openSettings || (() => console.log('Open settings')),
          priority: 'high',
          icon: 'key'
        });
        break;

      case 'validation':
        actions.push({
          type: 'fix_input',
          label: 'Fix Input',
          description: 'Correct the input and try again',
          action: options.focusInput || (() => console.log('Focus input')),
          priority: 'high',
          icon: 'edit'
        });
        break;

      case 'system':
        actions.push({
          type: 'clear_storage',
          label: 'Clear Storage',
          description: 'Free up storage space',
          action: () => this.clearStorageSpace(),
          priority: 'medium',
          icon: 'trash'
        });
        break;
    }

    // Always add refresh option for critical errors
    if (this.determineSeverity(error, context) === 'critical') {
      actions.push({
        type: 'refresh',
        label: 'Refresh Page',
        description: 'Refresh the page to reset the application',
        action: () => window.location.reload(),
        priority: 'medium',
        icon: 'refresh'
      });
    }

    return actions;
  }

  /**
   * Check if error can be retried
   */
  private canRetry(error: Error, context: string): boolean {
    const message = error.message?.toLowerCase() || '';
    
    // Network errors are usually retryable
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return true;
    }

    // Temporary server errors
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return true;
    }

    // Rate limiting
    if (message.includes('429') || message.includes('rate limit')) {
      return true;
    }

    // AI service temporary issues
    if (context.includes('AI') && !message.includes('api key')) {
      return true;
    }

    return false;
  }

  /**
   * Check if error is temporary
   */
  private isTemporary(error: Error): boolean {
    const message = error.message?.toLowerCase() || '';
    
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('temporary') ||
           message.includes('503') ||
           message.includes('rate limit');
  }

  /**
   * Collect error metadata
   */
  private collectMetadata(error: Error, options: any): ErrorMetadata {
    return {
      errorCode: (error as any).code || undefined,
      statusCode: (error as any).status || undefined,
      stack: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userId: options.userId,
      sessionId: options.sessionId || this.generateSessionId(),
      buildVersion: import.meta.env.VITE_APP_VERSION || '1.0.0'
    };
  }

  /**
   * Track error for statistics
   */
  private trackError(errorContext: ErrorContext): void {
    this.errorStats.totalErrors++;
    this.errorStats.errorsByCategory[errorContext.category] = 
      (this.errorStats.errorsByCategory[errorContext.category] || 0) + 1;
    this.errorStats.errorsBySeverity[errorContext.severity] = 
      (this.errorStats.errorsBySeverity[errorContext.severity] || 0) + 1;

    // Add to recent errors
    this.errorStats.recentErrors.unshift(errorContext);
    if (this.errorStats.recentErrors.length > this.maxRecentErrors) {
      this.errorStats.recentErrors.pop();
    }

    // Add to queue
    this.errorQueue.unshift(errorContext);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.pop();
    }

    // Update trends
    this.updateErrorTrends();
  }

  /**
   * Log error appropriately
   */
  private logError(errorContext: ErrorContext): void {
    if (import.meta.env.DEV) {
      console.group(`🔴 Error in ${errorContext.context}`);
      console.error('Message:', errorContext.message);
      console.error('User Message:', errorContext.userMessage);
      console.error('Severity:', errorContext.severity);
      console.error('Category:', errorContext.category);
      console.error('Metadata:', errorContext.metadata);
      console.groupEnd();
    } else {
      console.error(`Error in ${errorContext.context}: ${errorContext.userMessage}`);
    }
  }

  /**
   * Notify error listeners
   */
  private notifyListeners(errorContext: ErrorContext): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorContext);
      } catch (e) {
        console.warn('Error listener failed:', e);
      }
    });
  }

  /**
   * Attempt automatic recovery for certain errors
   */
  private attemptAutoRecovery(errorContext: ErrorContext): void {
    // Auto-retry for temporary network errors
    if (errorContext.category === 'network' && errorContext.isTemporary) {
      setTimeout(() => {
        console.log('Attempting auto-recovery for network error...');
        // Could trigger a retry here
      }, 5000);
    }

    // Auto-clear storage for quota errors
    if (errorContext.message.includes('quota') || errorContext.message.includes('storage')) {
      this.clearStorageSpace();
    }
  }

  /**
   * Clear storage space
   */
  private clearStorageSpace(): void {
    try {
      // Clear old error logs
      const errors = JSON.parse(localStorage.getItem('birch-lounge-errors') || '[]');
      if (errors.length > 5) {
        localStorage.setItem('birch-lounge-errors', JSON.stringify(errors.slice(-5)));
      }

      // Clear old cache entries
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        });
      }

      console.log('Storage space cleared');
    } catch (e) {
      console.warn('Failed to clear storage space:', e);
    }
  }

  /**
   * Update error trends
   */
  private updateErrorTrends(): void {
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    
    const existingTrend = this.errorStats.errorTrends.find(t => t.timestamp === hourKey);
    if (existingTrend) {
      existingTrend.count++;
    } else {
      this.errorStats.errorTrends.push({ timestamp: hourKey, count: 1 });
    }

    // Keep only last 24 hours
    if (this.errorStats.errorTrends.length > 24) {
      this.errorStats.errorTrends = this.errorStats.errorTrends.slice(-24);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add error listener
   */
  addErrorListener(listener: (error: ErrorContext) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeErrorListener(listener: (error: ErrorContext) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    return { ...this.errorStats };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorQueue = [];
    this.errorStats = {
      totalErrors: 0,
      errorsByCategory: {},
      errorsBySeverity: {},
      recentErrors: [],
      errorTrends: []
    };
  }

  /**
   * Export error logs for debugging
   */
  exportErrorLogs(): string {
    return JSON.stringify({
      stats: this.errorStats,
      queue: this.errorQueue,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

export const enhancedErrorHandler = new EnhancedErrorHandler();
export default enhancedErrorHandler;
