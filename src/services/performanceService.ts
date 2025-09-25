// =============================================================================
// PERFORMANCE MONITORING SERVICE
// =============================================================================

import type {
  WebVitals,
  CustomMetrics,
  PerformanceSession,
  PerformanceAlert,
  PerformanceConfig,
  PerformanceBudget,
  PerformanceReport,
  PerformanceObserverCallback,
  PerformanceMonitoringService,
  MemoryUsage,
  PerformanceAlertLevel
} from '../types/performance';
import { generateId } from '../utils';

/**
 * Default performance budget based on Core Web Vitals recommendations
 */
const DEFAULT_BUDGET: PerformanceBudget = {
  webVitals: {
    lcp: 2500,  // Good: < 2.5s
    fid: 100,   // Good: < 100ms
    cls: 0.1,   // Good: < 0.1
    fcp: 1800,  // Good: < 1.8s
    ttfb: 600,  // Good: < 600ms
    inp: 200    // Good: < 200ms
  },
  custom: {
    apiResponseTime: 500,      // < 500ms
    searchResponseTime: 100,   // < 100ms
    modalOpenTime: 300,        // < 300ms
    componentRenderTime: 16,   // < 16ms (60fps)
    memoryGrowthLimit: 50 * 1024 * 1024 // 50MB
  }
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: true,
  budget: DEFAULT_BUDGET,
  sampling: {
    webVitals: true,
    customMetrics: true,
    memoryMonitoring: true,
    networkMonitoring: true
  },
  reporting: {
    realTime: true,
    sessionStorage: true,
    analytics: false
  },
  alerts: {
    enabled: true,
    showNotifications: false,
    logToConsole: true
  }
};

class PerformanceMonitor implements PerformanceMonitoringService {
  private config: PerformanceConfig = DEFAULT_CONFIG;
  private currentSession: PerformanceSession | null = null;
  private webVitals: WebVitals = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  };
  private customMetrics: CustomMetrics = {
    apiResponseTimes: {},
    componentRenderTimes: {},
    searchResponseTimes: [],
    modalTimes: { open: [], close: [] },
    navigationTimes: {},
    memoryUsage: [],
    bundleLoadTimes: {}
  };
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserverCallback[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private memoryMonitorInterval: NodeJS.Timeout | null = null;

  initialize(config: Partial<PerformanceConfig> = {}): void {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.enabled) return;

    this.setupWebVitalsMonitoring();
    this.setupResourceMonitoring();

    if (this.config.sampling.memoryMonitoring) {
      this.setupMemoryMonitoring();
    }

    if (this.config.debug?.logToConsole) {
      console.log('🚀 Performance monitoring initialized');
    }
  }

  private setupWebVitalsMonitoring(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.webVitals.lcp = lastEntry.startTime;
          this.checkAlert('lcp', lastEntry.startTime);
          this.notifyObservers('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            this.webVitals.fcp = fcpEntry.startTime;
            this.checkAlert('fcp', fcpEntry.startTime);
            this.notifyObservers('fcp', fcpEntry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.webVitals.cls = clsValue;
          this.checkAlert('cls', clsValue);
          this.notifyObservers('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Input Delay (FID) - approximated with event timing
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            const fid = (entry as any).processingStart - entry.startTime;
            this.webVitals.fid = fid;
            this.checkAlert('fid', fid);
            this.notifyObservers('fid', fid);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Navigation timing for TTFB
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
        this.webVitals.ttfb = ttfb;
        this.checkAlert('ttfb', ttfb);
        this.notifyObservers('ttfb', ttfb);
      }
    }
  }

  private setupResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              const loadTime = resourceEntry.responseEnd - resourceEntry.startTime;

              // Track bundle load times
              if (resourceEntry.name.includes('.js') || resourceEntry.name.includes('.css')) {
                const fileName = resourceEntry.name.split('/').pop() || 'unknown';
                this.customMetrics.bundleLoadTimes[fileName] = loadTime;
                this.notifyObservers('bundleLoad', loadTime, { fileName });
              }
            }
          }
        });
        this.performanceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource monitoring setup failed:', error);
      }
    }
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      this.memoryMonitorInterval = setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsage: MemoryUsage = {
          timestamp: Date.now(),
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };

        this.customMetrics.memoryUsage.push(memoryUsage);

        // Keep only last 100 samples
        if (this.customMetrics.memoryUsage.length > 100) {
          this.customMetrics.memoryUsage = this.customMetrics.memoryUsage.slice(-100);
        }

        // Check for memory growth
        if (this.customMetrics.memoryUsage.length > 1) {
          const previous = this.customMetrics.memoryUsage[this.customMetrics.memoryUsage.length - 2];
          const growth = memoryUsage.usedJSHeapSize - previous.usedJSHeapSize;
          if (growth > this.config.budget.custom.memoryGrowthLimit) {
            this.checkAlert('memoryGrowth', growth);
          }
        }

        this.notifyObservers('memory', memoryUsage.usedJSHeapSize, memoryUsage);
      }, 5000); // Every 5 seconds
    }
  }

  startSession(): string {
    const sessionId = generateId('perf_session');

    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      webVitals: { ...this.webVitals },
      customMetrics: JSON.parse(JSON.stringify(this.customMetrics)),
      alerts: [],
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Add connection info if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.currentSession.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    this.notifyObservers('sessionStart', Date.now(), { sessionId });
    return sessionId;
  }

  endSession(sessionId: string): PerformanceSession | null {
    if (!this.currentSession || this.currentSession.sessionId !== sessionId) {
      return null;
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.webVitals = { ...this.webVitals };
    this.currentSession.customMetrics = JSON.parse(JSON.stringify(this.customMetrics));
    this.currentSession.alerts = [...this.alerts];

    const session = this.currentSession;
    this.currentSession = null;

    if (this.config.reporting.sessionStorage) {
      this.saveSessionToStorage(session);
    }

    this.notifyObservers('sessionEnd', Date.now(), { session });
    return session;
  }

  recordMetric(metric: string, value: number, details?: any): void {
    const timestamp = Date.now();

    // Record custom metrics
    switch (metric) {
      case 'apiResponse':
        const endpoint = details?.endpoint || 'unknown';
        if (!this.customMetrics.apiResponseTimes[endpoint]) {
          this.customMetrics.apiResponseTimes[endpoint] = [];
        }
        this.customMetrics.apiResponseTimes[endpoint].push(value);
        this.checkAlert('apiResponseTime', value);
        // Log timestamp for debugging
        console.debug(`API response recorded at ${timestamp}: ${endpoint} - ${value}ms`);
        break;

      case 'searchResponse':
        this.customMetrics.searchResponseTimes.push(value);
        this.checkAlert('searchResponseTime', value);
        break;

      case 'modalOpen':
        this.customMetrics.modalTimes.open.push(value);
        this.checkAlert('modalOpenTime', value);
        break;

      case 'modalClose':
        this.customMetrics.modalTimes.close.push(value);
        break;

      case 'componentRender':
        const component = details?.component || 'unknown';
        if (!this.customMetrics.componentRenderTimes[component]) {
          this.customMetrics.componentRenderTimes[component] = [];
        }
        this.customMetrics.componentRenderTimes[component].push(value);
        this.checkAlert('componentRenderTime', value);
        break;

      case 'navigation':
        const tab = details?.tab || 'unknown';
        if (!this.customMetrics.navigationTimes[tab]) {
          this.customMetrics.navigationTimes[tab] = [];
        }
        this.customMetrics.navigationTimes[tab].push(value);
        break;
    }

    this.notifyObservers(metric, value, details);
  }

  private checkAlert(metric: string, value: number): void {
    if (!this.config.alerts.enabled) return;

    let threshold: number;
    let level: PerformanceAlertLevel;
    let message: string;
    let suggestions: string[] = [];

    // Determine threshold and level based on metric
    switch (metric) {
      case 'lcp':
        threshold = this.config.budget.webVitals.lcp;
        level = value > 4000 ? 'poor' : value > threshold ? 'needs-improvement' : 'good';
        message = `Largest Contentful Paint: ${value.toFixed(0)}ms`;
        if (level !== 'good') {
          suggestions = [
            'Optimize images and use modern formats (WebP, AVIF)',
            'Implement lazy loading for images',
            'Reduce server response times',
            'Use a CDN for static assets'
          ];
        }
        break;

      case 'fid':
        threshold = this.config.budget.webVitals.fid;
        level = value > 300 ? 'poor' : value > threshold ? 'needs-improvement' : 'good';
        message = `First Input Delay: ${value.toFixed(0)}ms`;
        if (level !== 'good') {
          suggestions = [
            'Break up long-running JavaScript tasks',
            'Use web workers for heavy computations',
            'Implement code splitting',
            'Defer non-critical JavaScript'
          ];
        }
        break;

      case 'cls':
        threshold = this.config.budget.webVitals.cls;
        level = value > 0.25 ? 'poor' : value > threshold ? 'needs-improvement' : 'good';
        message = `Cumulative Layout Shift: ${value.toFixed(3)}`;
        if (level !== 'good') {
          suggestions = [
            'Set explicit dimensions for images and videos',
            'Reserve space for dynamic content',
            'Avoid inserting content above existing content',
            'Use CSS transforms for animations'
          ];
        }
        break;

      case 'searchResponseTime':
        threshold = this.config.budget.custom.searchResponseTime;
        level = value > 200 ? 'poor' : value > threshold ? 'needs-improvement' : 'good';
        message = `Search response time: ${value.toFixed(0)}ms`;
        if (level !== 'good') {
          suggestions = [
            'Implement search result caching',
            'Use debouncing for search input',
            'Optimize search algorithms',
            'Consider server-side search indexing'
          ];
        }
        break;

      default:
        return; // Don't create alerts for unknown metrics
    }

    if (level !== 'good') {
      const alert: PerformanceAlert = {
        id: generateId('alert'),
        timestamp: Date.now(),
        metric,
        value,
        threshold,
        level,
        message,
        suggestions
      };

      this.alerts.push(alert);

      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(-50);
      }

      if (this.config.alerts.logToConsole) {
        console.warn(`⚠️ Performance Alert: ${message}`, alert);
      }

      this.notifyObservers('alert', value, alert);
    }
  }

  private notifyObservers(metric: string, value: number, details?: any): void {
    this.observers.forEach(callback => {
      try {
        callback(metric, value, details);
      } catch (error) {
        console.error('Performance observer callback error:', error);
      }
    });
  }

  private saveSessionToStorage(session: PerformanceSession): void {
    try {
      const sessions = this.getStoredSessions();
      sessions.push(session);

      // Keep only last 10 sessions
      const recentSessions = sessions.slice(-10);
      localStorage.setItem('performance_sessions', JSON.stringify(recentSessions));
    } catch (error) {
      console.warn('Failed to save performance session:', error);
    }
  }

  private getStoredSessions(): PerformanceSession[] {
    try {
      const stored = localStorage.getItem('performance_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load stored sessions:', error);
      return [];
    }
  }

  getWebVitals(): WebVitals {
    return { ...this.webVitals };
  }

  getCustomMetrics(): CustomMetrics {
    return JSON.parse(JSON.stringify(this.customMetrics));
  }

  getCurrentSession(): PerformanceSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  generateReport(timeRange?: { start: number; end: number }): PerformanceReport {
    const sessions = this.getStoredSessions();
    const filteredSessions = timeRange
      ? sessions.filter(s => s.startTime >= timeRange.start && s.startTime <= timeRange.end)
      : sessions;

    // Calculate averages
    const averageWebVitals: WebVitals = {
      lcp: this.calculateAverage(filteredSessions.map(s => s.webVitals.lcp).filter(v => v !== null)),
      fid: this.calculateAverage(filteredSessions.map(s => s.webVitals.fid).filter(v => v !== null)),
      cls: this.calculateAverage(filteredSessions.map(s => s.webVitals.cls).filter(v => v !== null)),
      fcp: this.calculateAverage(filteredSessions.map(s => s.webVitals.fcp).filter(v => v !== null)),
      ttfb: this.calculateAverage(filteredSessions.map(s => s.webVitals.ttfb).filter(v => v !== null)),
      inp: this.calculateAverage(filteredSessions.map(s => s.webVitals.inp).filter(v => v !== null))
    };

    // Count alerts by level
    const allAlerts = filteredSessions.flatMap(s => s.alerts);
    const alertCounts = {
      good: 0,
      'needs-improvement': allAlerts.filter(a => a.level === 'needs-improvement').length,
      poor: allAlerts.filter(a => a.level === 'poor').length
    };

    return {
      reportId: generateId('report'),
      generatedAt: Date.now(),
      timeRange: timeRange || { start: 0, end: Date.now() },
      sessions: filteredSessions,
      summary: {
        totalSessions: filteredSessions.length,
        averageWebVitals,
        alertCounts,
        topIssues: this.getTopIssues(allAlerts),
        improvements: this.getImprovementSuggestions(allAlerts)
      }
    };
  }

  private calculateAverage(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getTopIssues(alerts: PerformanceAlert[]): string[] {
    const issueCounts = alerts.reduce((acc, alert) => {
      acc[alert.metric] = (acc[alert.metric] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([metric]) => metric);
  }

  private getImprovementSuggestions(alerts: PerformanceAlert[]): string[] {
    const suggestions = new Set<string>();
    alerts.forEach(alert => {
      alert.suggestions.forEach(suggestion => suggestions.add(suggestion));
    });
    return Array.from(suggestions).slice(0, 10);
  }

  subscribe(callback: PerformanceObserverCallback): () => void {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  clearData(): void {
    this.alerts = [];
    this.customMetrics = {
      apiResponseTimes: {},
      componentRenderTimes: {},
      searchResponseTimes: [],
      modalTimes: { open: [], close: [] },
      navigationTimes: {},
      memoryUsage: [],
      bundleLoadTimes: {}
    };
    localStorage.removeItem('performance_sessions');
    this.notifyObservers('dataCleared', Date.now());
  }

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
