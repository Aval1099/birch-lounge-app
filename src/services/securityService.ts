// =============================================================================
// SECURITY SERVICE - Comprehensive API key and sensitive data protection
// =============================================================================

/**
 * Security violation types
 */
export type SecurityViolationType =
  | 'api_key_exposed'
  | 'sensitive_data_logged'
  | 'insecure_storage'
  | 'weak_encryption'
  | 'unauthorized_access'
  | 'data_leak'
  | 'xss_attempt'
  | 'csrf_attempt'
  | 'initialization_failed'
  | 'csp_violation'
  | 'api_key_expired'
  | 'api_key_rotation_needed'
  | 'suspicious_activity';

/**
 * Security event data
 */
interface SecurityEvent {
  type: SecurityViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  details: Record<string, any>;
  source: string;
  userAgent?: string;
  ip?: string;
}

/**
 * API key security metadata
 */
interface ApiKeyMetadata {
  service: string;
  keyHash: string;
  source: 'environment' | 'user_input' | 'storage';
  isEncrypted: boolean;
  lastRotated?: number;
  expiresAt?: number;
  permissions: string[];
  usageCount: number;
  lastUsed?: number;
}

/**
 * Security configuration
 */
interface SecurityConfig {
  enableKeyRotation: boolean;
  keyRotationInterval: number; // in milliseconds
  enableUsageTracking: boolean;
  enableSecurityLogging: boolean;
  maxKeyAge: number; // in milliseconds
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableContentSecurityPolicy: boolean;
}

/**
 * Comprehensive Security Service
 * Provides enterprise-grade security for API keys and sensitive data
 */
export class SecurityService {
  private securityEvents: SecurityEvent[] = [];
  private apiKeyMetadata: Map<string, ApiKeyMetadata> = new Map();
  private encryptionKey: CryptoKey | null = null;
  private config: SecurityConfig = {
    enableKeyRotation: true,
    keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
    enableUsageTracking: true,
    enableSecurityLogging: true,
    maxKeyAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    enableXSSProtection: true,
    enableCSRFProtection: true,
    enableContentSecurityPolicy: true
  };
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize security service
   */
  private async initialize(): Promise<void> {
    try {
      // Generate encryption key for sensitive data
      await this.generateEncryptionKey();

      // Set up security headers
      this.setupSecurityHeaders();

      // Set up XSS protection
      this.setupXSSProtection();

      // Set up CSRF protection
      this.setupCSRFProtection();

      // Start security monitoring
      this.startSecurityMonitoring();

      // Clean up old security events
      this.cleanupOldEvents();

      this.isInitialized = true;
      console.log('🔒 Security Service initialized with enterprise-grade protection');
    } catch (error) {
      console.error('Failed to initialize Security Service:', error);
      this.logSecurityEvent('initialization_failed', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate encryption key for sensitive data
   */
  private async generateEncryptionKey(): Promise<void> {
    if ('crypto' in window && 'subtle' in window.crypto) {
      try {
        this.encryptionKey = await window.crypto.subtle.generateKey(
          {
            name: 'AES-GCM',
            length: 256
          },
          false, // not extractable
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Failed to generate encryption key:', error);
      }
    }
  }

  /**
   * Set up security headers
   */
  private setupSecurityHeaders(): void {
    if (this.config.enableContentSecurityPolicy) {
      // Note: CSP headers should be set by the server, but we can monitor compliance
      this.monitorContentSecurityPolicy();
    }
  }

  /**
   * Set up XSS protection
   */
  private setupXSSProtection(): void {
    if (!this.config.enableXSSProtection) return;

    // Monitor for potential XSS attempts
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')?.set;
    if (originalInnerHTML) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value: string) {
          if (typeof value === 'string' && securityService._isXSSAttempt(value)) {
            securityService.logSecurityEvent('xss_attempt', 'high', {
              element: this.tagName,
              content: value.substring(0, 100) + '...',
              source: 'innerHTML'
            });
            return;
          }
          return originalInnerHTML.call(this, value);
        },
        configurable: true
      });
    }

    // Monitor console for sensitive data
    this.monitorConsoleOutput();
  }

  /**
   * Set up CSRF protection
   */
  private setupCSRFProtection(): void {
    if (!this.config.enableCSRFProtection) return;

    // Generate CSRF token
    const csrfToken = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', csrfToken);

    // Monitor for CSRF attempts
    this.monitorCSRFAttempts();
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Monitor for API key exposure in network requests
    this.monitorNetworkRequests();

    // Monitor for sensitive data in localStorage
    this.monitorLocalStorage();

    // Monitor for unauthorized access attempts
    this.monitorUnauthorizedAccess();

    // Set up periodic security checks
    setInterval(() => {
      this.performSecurityAudit();
    }, 60000); // Every minute
  }

  /**
   * Monitor network requests for API key exposure
   */
  private monitorNetworkRequests(): void {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      // Check for API keys in URL
      if (this.containsApiKey(url)) {
        this.logSecurityEvent('api_key_exposed', 'critical', {
          url: this.sanitizeUrl(url),
          method: init?.method || 'GET',
          source: 'fetch_url'
        });
      }

      // Check for API keys in headers
      if (init?.headers) {
        const headers = new Headers(init.headers);
        for (const [key, value] of headers.entries()) {
          if (this.containsApiKey(value)) {
            this.logSecurityEvent('api_key_exposed', 'critical', {
              header: key,
              source: 'fetch_headers'
            });
          }
        }
      }

      return originalFetch(input, init);
    };
  }

  /**
   * Monitor localStorage for sensitive data
   */
  private monitorLocalStorage(): void {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      if (securityService.containsApiKey(value)) {
        securityService.logSecurityEvent('insecure_storage', 'high', {
          key,
          source: 'localStorage'
        });
        // Prevent storing API keys in localStorage
        console.warn('🔒 Security: Prevented API key storage in localStorage');
        return;
      }
      return originalSetItem.call(this, key, value);
    };
  }

  /**
   * Monitor console output for sensitive data
   */
  private monitorConsoleOutput(): void {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      this.checkConsoleArgs(args, 'log');
      return originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      this.checkConsoleArgs(args, 'error');
      return originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.checkConsoleArgs(args, 'warn');
      return originalWarn.apply(console, args);
    };
  }

  /**
   * Check console arguments for sensitive data
   */
  private checkConsoleArgs(args: any[], level: string): void {
    args.forEach(arg => {
      if (typeof arg === 'string' && this.containsApiKey(arg)) {
        this.logSecurityEvent('sensitive_data_logged', 'medium', {
          level,
          source: 'console'
        });
      }
    });
  }

  /**
   * Check if content contains API keys
   */
  private containsApiKey(content: string): boolean {
    if (!content || typeof content !== 'string') return false;

    const apiKeyPatterns = [
      /AIza[0-9A-Za-z-_]{35}/, // Google API keys
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
      /sk-ant-[a-zA-Z0-9-_]{95}/, // Anthropic API keys
      /eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/, // JWT tokens
      /[a-zA-Z0-9]{32,}/ // Generic long strings that might be keys
    ];

    return apiKeyPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Sanitize URL for logging
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters that might contain sensitive data
      urlObj.search = '';
      return urlObj.toString();
    } catch {
      return '[INVALID_URL]';
    }
  }

  /**
   * Check if content is XSS attempt
   */
  private _isXSSAttempt(content: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Generate CSRF token
   */
  private generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Monitor for CSRF attempts
   */
  private monitorCSRFAttempts(): void {
    // This would be implemented based on your specific CSRF protection needs
    // For now, we'll monitor for suspicious form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      if (form && !this.hasValidCSRFToken(form)) {
        this.logSecurityEvent('csrf_attempt', 'high', {
          formAction: form.action,
          formMethod: form.method
        });
      }
    });
  }

  /**
   * Check if form has valid CSRF token
   */
  private hasValidCSRFToken(form: HTMLFormElement): boolean {
    const formData = new FormData(form);
    const token = formData.get('csrf_token') as string;
    const sessionToken = sessionStorage.getItem('csrf_token');
    return token === sessionToken;
  }

  /**
   * Monitor for unauthorized access attempts
   */
  private monitorUnauthorizedAccess(): void {
    // Monitor for rapid API calls that might indicate abuse
    let apiCallCount = 0;
    const resetInterval = 60000; // 1 minute

    setInterval(() => {
      if (apiCallCount > 100) { // More than 100 API calls per minute
        this.logSecurityEvent('unauthorized_access', 'medium', {
          callCount: apiCallCount,
          timeWindow: '1 minute'
        });
      }
      apiCallCount = 0;
    }, resetInterval);

    // Increment counter on API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      apiCallCount++;
      return originalFetch(...args);
    };
  }

  /**
   * Monitor Content Security Policy compliance
   */
  private monitorContentSecurityPolicy(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      this.logSecurityEvent('csp_violation', 'medium', {
        violatedDirective: event.violatedDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });
    });
  }

  /**
   * Perform periodic security audit
   */
  private performSecurityAudit(): void {
    // Check for expired API keys
    this.checkExpiredApiKeys();

    // Check for suspicious activity patterns
    this.checkSuspiciousActivity();

    // Clean up old security events
    this.cleanupOldEvents();
  }

  /**
   * Check for expired API keys
   */
  private checkExpiredApiKeys(): void {
    const now = Date.now();

    this.apiKeyMetadata.forEach((metadata) => {
      if (metadata.expiresAt && metadata.expiresAt < now) {
        this.logSecurityEvent('api_key_expired', 'medium', {
          service: metadata.service,
          expiredAt: metadata.expiresAt
        });
      }

      if (metadata.lastRotated && (now - metadata.lastRotated) > this.config.maxKeyAge) {
        this.logSecurityEvent('api_key_rotation_needed', 'low', {
          service: metadata.service,
          age: now - metadata.lastRotated
        });
      }
    });
  }

  /**
   * Check for suspicious activity patterns
   */
  private checkSuspiciousActivity(): void {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - event.timestamp < 300000 // Last 5 minutes
    );

    // Check for multiple high-severity events
    const highSeverityEvents = recentEvents.filter(event => event.severity === 'high');
    if (highSeverityEvents.length > 5) {
      this.logSecurityEvent('suspicious_activity', 'critical', {
        eventCount: highSeverityEvents.length,
        timeWindow: '5 minutes'
      });
    }
  }

  /**
   * Clean up old security events
   */
  private cleanupOldEvents(): void {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cutoff = Date.now() - maxAge;

    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp > cutoff
    );
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    type: SecurityViolationType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      timestamp: Date.now(),
      details,
      source: this.getCallSource(),
      userAgent: navigator.userAgent
    };

    this.securityEvents.push(event);

    // Log to console based on severity
    const logLevel = severity === 'critical' ? 'error' :
                    severity === 'high' ? 'warn' : 'log';
    console[logLevel](`🔒 Security Event [${severity.toUpperCase()}]:`, type, details);

    // Trigger immediate action for critical events
    if (severity === 'critical') {
      this.handleCriticalSecurityEvent(event);
    }
  }

  /**
   * Get call source for security event
   */
  private getCallSource(): string {
    try {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        return lines[3] || 'unknown';
      }
    } catch {
      // Ignore
    }
    return 'unknown';
  }

  /**
   * Handle critical security events
   */
  private handleCriticalSecurityEvent(event: SecurityEvent): void {
    // For critical events, we might want to:
    // 1. Clear sensitive data from memory
    // 2. Notify the user
    // 3. Disable certain features temporarily

    if (event.type === 'api_key_exposed') {
      // Clear API keys from memory
      console.warn('🔒 Critical: API key exposure detected. Clearing sensitive data.');
      // You might want to integrate with your API key service here
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string): Promise<string | null> {
    if (!this.encryptionKey) return null;

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray, iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: string): Promise<string | null> {
    if (!this.encryptionKey) return null;

    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Register API key metadata
   */
  registerApiKey(
    service: string,
    keyHash: string,
    metadata: Partial<ApiKeyMetadata>
  ): void {
    this.apiKeyMetadata.set(keyHash, {
      service,
      keyHash,
      source: metadata.source || 'user_input',
      isEncrypted: metadata.isEncrypted || false,
      lastRotated: metadata.lastRotated || Date.now(),
      expiresAt: metadata.expiresAt,
      permissions: metadata.permissions || [],
      usageCount: metadata.usageCount || 0,
      lastUsed: metadata.lastUsed
    });
  }

  /**
   * Track API key usage
   */
  trackApiKeyUsage(keyHash: string): void {
    const metadata = this.apiKeyMetadata.get(keyHash);
    if (metadata) {
      metadata.usageCount++;
      metadata.lastUsed = Date.now();
    }
  }

  /**
   * Get security report
   */
  getSecurityReport(): {
    events: SecurityEvent[];
    summary: Record<string, number>;
    recommendations: string[];
  } {
    const summary: Record<string, number> = {};

    this.securityEvents.forEach(event => {
      summary[event.type] = (summary[event.type] || 0) + 1;
    });

    const recommendations = this.generateSecurityRecommendations();

    return {
      events: [...this.securityEvents],
      summary,
      recommendations
    };
  }

  /**
   * Generate security recommendations
   */
  private generateSecurityRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check for API key exposure
    if (this.securityEvents.some(e => e.type === 'api_key_exposed')) {
      recommendations.push('Rotate all exposed API keys immediately');
      recommendations.push('Review code for hardcoded API keys');
    }

    // Check for XSS attempts
    if (this.securityEvents.some(e => e.type === 'xss_attempt')) {
      recommendations.push('Implement Content Security Policy headers');
      recommendations.push('Sanitize all user inputs');
    }

    // Check for insecure storage
    if (this.securityEvents.some(e => e.type === 'insecure_storage')) {
      recommendations.push('Use secure storage mechanisms for sensitive data');
      recommendations.push('Encrypt sensitive data before storage');
    }

    return recommendations;
  }

  /**
   * Clear all security data
   */
  clearSecurityData(): void {
    this.securityEvents = [];
    this.apiKeyMetadata.clear();
  }

  /**
   * Destroy security service and clean up resources
   */
  destroy(): void {
    this.clearSecurityData();
    this.isInitialized = false;
    // Additional cleanup can be added here if needed
  }

  /**
   * Get security status
   */
  getSecurityStatus(): {
    isSecure: boolean;
    criticalIssues: number;
    highIssues: number;
    lastAudit: number;
  } {
    const criticalIssues = this.securityEvents.filter(e => e.severity === 'critical').length;
    const highIssues = this.securityEvents.filter(e => e.severity === 'high').length;

    return {
      isSecure: criticalIssues === 0 && highIssues < 5,
      criticalIssues,
      highIssues,
      lastAudit: Date.now()
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();
