// =============================================================================
// PWA ANALYTICS SERVICE - Comprehensive usage tracking and insights
// =============================================================================

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | 'app_install'
  | 'app_launch'
  | 'offline_usage'
  | 'cache_hit'
  | 'cache_miss'
  | 'sync_complete'
  | 'sync_failed'
  | 'feature_usage'
  | 'performance_metric'
  | 'user_engagement'
  | 'error_occurred'
  | 'network_change'
  | 'app_install_prompt_shown'
  | 'network_online'
  | 'network_offline'
  | 'app_background'
  | 'app_foreground'
  | 'session_end';

/**
 * Analytics event data
 */
interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
}

/**
 * Device information
 */
interface DeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  isStandalone: boolean;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
}

/**
 * Network information
 */
interface NetworkInfo {
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

/**
 * Usage session data
 */
interface UsageSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  isOffline: boolean;
  featuresUsed: string[];
  eventsCount: number;
  performanceMetrics: PerformanceMetrics;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

/**
 * Analytics insights
 */
interface AnalyticsInsights {
  totalSessions: number;
  averageSessionDuration: number;
  offlineUsagePercentage: number;
  mostUsedFeatures: Array<{ feature: string; usage: number }>;
  performanceTrends: PerformanceMetrics;
  userRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  cacheEfficiency: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
  };
  errorRate: number;
  installationRate: number;
}

/**
 * PWA Analytics Service
 * Provides comprehensive analytics for PWA usage, performance, and user behavior
 */
class PWAAnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessions: UsageSession[] = [];
  private currentSession: UsageSession | null = null;
  private sessionId: string = '';
  private userId?: string;
  private isInitialized = false;
  private performanceObserver?: PerformanceObserver;
  private maxStoredEvents = 10000;
  private maxStoredSessions = 1000;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize analytics service
   */
  private async initialize(): Promise<void> {
    try {
      // Generate session ID
      this.sessionId = this.generateSessionId();

      // Load stored data
      await this.loadStoredData();

      // Set up device and network info collection
      this.setupDeviceInfo();
      this.setupNetworkInfo();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      // Start new session
      this.startSession();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('PWA Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize PWA Analytics Service:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load stored analytics data
   */
  private async loadStoredData(): Promise<void> {
    try {
      const storedEvents = localStorage.getItem('pwa_analytics_events');
      const storedSessions = localStorage.getItem('pwa_analytics_sessions');

      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
      }

      if (storedSessions) {
        this.sessions = JSON.parse(storedSessions);
      }
    } catch (error) {
      console.error('Failed to load stored analytics data:', error);
    }
  }

  /**
   * Set up device information collection
   */
  private setupDeviceInfo(): void {
    // Device info is collected when tracking events
  }

  /**
   * Set up network information collection
   */
  private setupNetworkInfo(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.trackEvent('network_change', {
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      });
    }
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor Web Vitals
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformanceMetric(entry);
        }
      });

      // Observe different performance entry types
      try {
        this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Some performance metrics not supported:', error);
      }
    }
  }

  /**
   * Set up event listeners for automatic tracking
   */
  private setupEventListeners(): void {
    // Track app installation
    window.addEventListener('beforeinstallprompt', () => {
      this.trackEvent('app_install_prompt_shown', {});
    });

    // Track app launch
    window.addEventListener('appinstalled', () => {
      this.trackEvent('app_install', {});
    });

    // Track online/offline status
    window.addEventListener('online', () => {
      this.trackEvent('network_online', {});
    });

    window.addEventListener('offline', () => {
      this.trackEvent('network_offline', {});
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('app_background', {});
      } else {
        this.trackEvent('app_foreground', {});
      }
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  /**
   * Start new usage session
   */
  private startSession(): void {
    this.currentSession = {
      id: this.sessionId,
      startTime: Date.now(),
      isOffline: !navigator.onLine,
      featuresUsed: [],
      eventsCount: 0,
      performanceMetrics: {
        loadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        timeToInteractive: 0
      }
    };

    this.trackEvent('app_launch', {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      referrer: document.referrer
    });
  }

  /**
   * End current session
   */
  private endSession(): void {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;

      this.sessions.push(this.currentSession);
      this.persistData();

      this.trackEvent('session_end', {
        duration: this.currentSession.duration,
        featuresUsed: this.currentSession.featuresUsed.length,
        eventsCount: this.currentSession.eventsCount
      });
    }
  }

  /**
   * Track analytics event
   */
  trackEvent(type: AnalyticsEventType, data: Record<string, any>): void {
    if (!this.isInitialized) return;

    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      userId: this.userId,
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo()
    };

    this.events.push(event);

    // Update current session
    if (this.currentSession) {
      this.currentSession.eventsCount++;

      // Track feature usage
      if (data.feature && !this.currentSession.featuresUsed.includes(data.feature)) {
        this.currentSession.featuresUsed.push(data.feature);
      }
    }

    // Persist data periodically
    if (this.events.length % 50 === 0) {
      this.persistData();
    }

    // Cleanup old events
    this.cleanupOldData();
  }

  /**
   * Track performance metric
   */
  private trackPerformanceMetric(entry: PerformanceEntry): void {
    const metricData: Record<string, any> = {
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration
    };

    // Add specific data based on entry type
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      metricData.loadTime = navEntry.loadEventEnd - navEntry.startTime;
      metricData.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.startTime;
    } else if (entry.entryType === 'paint') {
      metricData.paintType = entry.name;
    } else if (entry.entryType === 'largest-contentful-paint') {
      metricData.element = (entry as any).element?.tagName;
    }

    this.trackEvent('performance_metric', metricData);

    // Update current session performance metrics
    if (this.currentSession) {
      switch (entry.name) {
        case 'first-contentful-paint':
          this.currentSession.performanceMetrics.firstContentfulPaint = entry.startTime;
          break;
        case 'largest-contentful-paint':
          this.currentSession.performanceMetrics.largestContentfulPaint = entry.startTime;
          break;
      }
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection;

    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }

    return {
      type: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }

  /**
   * Persist analytics data to storage
   */
  private persistData(): void {
    try {
      localStorage.setItem('pwa_analytics_events', JSON.stringify(this.events));
      localStorage.setItem('pwa_analytics_sessions', JSON.stringify(this.sessions));
    } catch (error) {
      console.error('Failed to persist analytics data:', error);
    }
  }

  /**
   * Cleanup old data to prevent storage overflow
   */
  private cleanupOldData(): void {
    // Remove old events
    if (this.events.length > this.maxStoredEvents) {
      this.events = this.events.slice(-this.maxStoredEvents);
    }

    // Remove old sessions
    if (this.sessions.length > this.maxStoredSessions) {
      this.sessions = this.sessions.slice(-this.maxStoredSessions);
    }
  }

  /**
   * Generate comprehensive analytics insights
   */
  generateInsights(): AnalyticsInsights {
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    // Calculate session metrics
    const completedSessions = this.sessions.filter(s => s.endTime);
    const totalSessions = completedSessions.length;
    const averageSessionDuration = totalSessions > 0
      ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalSessions
      : 0;

    // Calculate offline usage
    const offlineSessions = completedSessions.filter(s => s.isOffline);
    const offlineUsagePercentage = totalSessions > 0 ? (offlineSessions.length / totalSessions) * 100 : 0;

    // Calculate feature usage
    const featureUsage = new Map<string, number>();
    completedSessions.forEach(session => {
      session.featuresUsed.forEach(feature => {
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      });
    });

    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    // Calculate performance trends
    const performanceEvents = this.events.filter(e => e.type === 'performance_metric');
    const performanceTrends: PerformanceMetrics = {
      loadTime: this.calculateAverageMetric(performanceEvents, 'loadTime'),
      firstContentfulPaint: this.calculateAverageMetric(performanceEvents, 'firstContentfulPaint'),
      largestContentfulPaint: this.calculateAverageMetric(performanceEvents, 'largestContentfulPaint'),
      firstInputDelay: this.calculateAverageMetric(performanceEvents, 'firstInputDelay'),
      cumulativeLayoutShift: this.calculateAverageMetric(performanceEvents, 'cumulativeLayoutShift'),
      timeToInteractive: this.calculateAverageMetric(performanceEvents, 'timeToInteractive')
    };

    // Calculate retention
    const dailyRetention = this.calculateRetention(dayMs);
    const weeklyRetention = this.calculateRetention(weekMs);
    const monthlyRetention = this.calculateRetention(monthMs);

    // Calculate cache efficiency
    const cacheHits = this.events.filter(e => e.type === 'cache_hit').length;
    const cacheMisses = this.events.filter(e => e.type === 'cache_miss').length;
    const totalRequests = cacheHits + cacheMisses;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    const missRate = totalRequests > 0 ? (cacheMisses / totalRequests) * 100 : 0;

    // Calculate error rate
    const errorEvents = this.events.filter(e => e.type === 'error_occurred').length;
    const totalEvents = this.events.length;
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

    // Calculate installation rate
    const installEvents = this.events.filter(e => e.type === 'app_install').length;
    const installPrompts = this.events.filter(e => e.type === 'app_install_prompt_shown').length;
    const installationRate = installPrompts > 0 ? (installEvents / installPrompts) * 100 : 0;

    return {
      totalSessions,
      averageSessionDuration,
      offlineUsagePercentage,
      mostUsedFeatures,
      performanceTrends,
      userRetention: {
        daily: dailyRetention,
        weekly: weeklyRetention,
        monthly: monthlyRetention
      },
      cacheEfficiency: {
        hitRate,
        missRate,
        totalRequests
      },
      errorRate,
      installationRate
    };
  }

  /**
   * Calculate average metric value
   */
  private calculateAverageMetric(events: AnalyticsEvent[], metricName: string): number {
    const values = events
      .map(e => e.data[metricName])
      .filter(v => typeof v === 'number' && !isNaN(v));

    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  /**
   * Calculate user retention for a given time period
   */
  private calculateRetention(periodMs: number): number {
    const now = Date.now();
    const cutoff = now - periodMs;

    const recentSessions = this.sessions.filter(s => s.startTime >= cutoff);
    const uniqueUsers = new Set(recentSessions.map(s => s.id.split('_')[1])); // Extract user identifier

    return uniqueUsers.size;
  }

  /**
   * Export analytics data
   */
  exportData(): { events: AnalyticsEvent[]; sessions: UsageSession[]; insights: AnalyticsInsights } {
    return {
      events: [...this.events],
      sessions: [...this.sessions],
      insights: this.generateInsights()
    };
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.events = [];
    this.sessions = [];
    localStorage.removeItem('pwa_analytics_events');
    localStorage.removeItem('pwa_analytics_sessions');
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current session info
   */
  getCurrentSession(): UsageSession | null {
    return this.currentSession;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.endSession();

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Export singleton instance
export const pwaAnalyticsService = new PWAAnalyticsService();
