// =============================================================================
// PERFORMANCE MONITORING TYPE DEFINITIONS
// =============================================================================

/**
 * Core Web Vitals metrics
 */
export interface WebVitals {
  /** Largest Contentful Paint - measures loading performance */
  lcp: number | null;
  /** First Input Delay - measures interactivity */
  fid: number | null;
  /** Cumulative Layout Shift - measures visual stability */
  cls: number | null;
  /** First Contentful Paint - measures loading */
  fcp: number | null;
  /** Time to First Byte - measures server response time */
  ttfb: number | null;
  /** Interaction to Next Paint - measures responsiveness */
  inp: number | null;
}

/**
 * Custom performance metrics
 */
export interface CustomMetrics {
  /** API response times by endpoint */
  apiResponseTimes: Record<string, number[]>;
  /** Component render times */
  componentRenderTimes: Record<string, number[]>;
  /** Search response times */
  searchResponseTimes: number[];
  /** Modal open/close times */
  modalTimes: {
    open: number[];
    close: number[];
  };
  /** Navigation times between tabs */
  navigationTimes: Record<string, number[]>;
  /** Memory usage samples */
  memoryUsage: MemoryUsage[];
  /** Bundle load times */
  bundleLoadTimes: Record<string, number>;
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Performance budget thresholds
 */
export interface PerformanceBudget {
  webVitals: {
    lcp: number; // Good: < 2.5s
    fid: number; // Good: < 100ms
    cls: number; // Good: < 0.1
    fcp: number; // Good: < 1.8s
    ttfb: number; // Good: < 600ms
    inp: number; // Good: < 200ms
  };
  custom: {
    apiResponseTime: number; // < 500ms
    searchResponseTime: number; // < 100ms
    modalOpenTime: number; // < 300ms
    componentRenderTime: number; // < 16ms (60fps)
    memoryGrowthLimit: number; // < 50MB
  };
}

/**
 * Performance alert levels
 */
export type PerformanceAlertLevel = 'good' | 'needs-improvement' | 'poor';

/**
 * Performance alert
 */
export interface PerformanceAlert {
  id: string;
  timestamp: number;
  metric: string;
  value: number;
  threshold: number;
  level: PerformanceAlertLevel;
  message: string;
  suggestions: string[];
}

/**
 * Performance session data
 */
export interface PerformanceSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  webVitals: WebVitals;
  customMetrics: CustomMetrics;
  alerts: PerformanceAlert[];
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

/**
 * Performance report
 */
export interface PerformanceReport {
  reportId: string;
  generatedAt: number;
  timeRange: {
    start: number;
    end: number;
  };
  sessions: PerformanceSession[];
  summary: {
    totalSessions: number;
    averageWebVitals: WebVitals;
    alertCounts: Record<PerformanceAlertLevel, number>;
    topIssues: string[];
    improvements: string[];
  };
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  enabled: boolean;
  budget: PerformanceBudget;
  sampling: {
    webVitals: boolean;
    customMetrics: boolean;
    memoryMonitoring: boolean;
    networkMonitoring: boolean;
  };
  reporting: {
    realTime: boolean;
    sessionStorage: boolean;
    analytics: boolean;
  };
  alerts: {
    enabled: boolean;
    showNotifications: boolean;
    logToConsole: boolean;
  };
}

/**
 * Performance observer callback
 */
export type PerformanceObserverCallback = (metric: string, value: number, details?: any) => void;

/**
 * Performance monitoring service interface
 */
export interface PerformanceMonitoringService {
  initialize(config: PerformanceConfig): void;
  startSession(): string;
  endSession(sessionId: string): PerformanceSession | null;
  recordMetric(metric: string, value: number, details?: any): void;
  getWebVitals(): WebVitals;
  getCustomMetrics(): CustomMetrics;
  getCurrentSession(): PerformanceSession | null;
  getAlerts(): PerformanceAlert[];
  generateReport(timeRange?: { start: number; end: number }): PerformanceReport;
  subscribe(callback: PerformanceObserverCallback): () => void;
  clearData(): void;
}

/**
 * Performance dashboard props
 */
export interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  showRealTime?: boolean;
  showAlerts?: boolean;
  showReports?: boolean;
}

/**
 * Performance metric card props
 */
export interface PerformanceMetricCardProps {
  title: string;
  value: number | null;
  threshold: number;
  unit: string;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

/**
 * Performance chart props
 */
export interface PerformanceChartProps {
  data: Array<{ timestamp: number; value: number }>;
  title: string;
  unit: string;
  threshold?: number;
  height?: number;
  className?: string;
}
