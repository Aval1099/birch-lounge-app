// =============================================================================
// CACHE PERFORMANCE MONITORING SERVICE
// =============================================================================

import { intelligentCacheService } from './intelligentCacheService';
import { cachePerformanceConfig } from './cachePerformanceConfig';
import type { OfflineStorageStats } from '../types/offline';

/**
 * Performance metrics for cache operations
 */
export interface CachePerformanceMetrics {
  // Response time metrics
  averageResponseTime: number; // ms
  p95ResponseTime: number; // ms
  p99ResponseTime: number; // ms

  // Cache efficiency metrics
  hitRate: number; // 0-1
  missRate: number; // 0-1
  evictionRate: number; // evictions per hour

  // Storage metrics
  storageUtilization: number; // 0-1
  compressionEfficiency: number; // space saved ratio

  // Access patterns
  accessFrequency: number; // accesses per minute
  hotDataRatio: number; // frequently accessed data ratio

  // System health
  memoryPressure: number; // 0-1
  errorRate: number; // errors per 1000 operations

  // Timestamps
  lastUpdated: number;
  measurementPeriod: number; // ms
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical';
  metric: keyof CachePerformanceMetrics;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

/**
 * Cache Performance Monitor
 * Tracks and analyzes cache performance metrics in real-time
 */
class CachePerformanceMonitor {
  private metrics: CachePerformanceMetrics;
  private responseTimes: number[] = [];
  private accessCounts: number[] = [];
  private errorCounts: number[] = [];
  private alerts: PerformanceAlert[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Performance thresholds
  private thresholds = {
    responseTime: {
      warning: 100, // ms
      critical: 500  // ms
    },
    hitRate: {
      warning: 0.8,
      critical: 0.6
    },
    storageUtilization: {
      warning: 0.8,
      critical: 0.95
    },
    errorRate: {
      warning: 10, // per 1000 operations
      critical: 50
    }
  };

  constructor() {
    this.metrics = this.initializeMetrics();
    this.updateThresholdsFromConfig();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): CachePerformanceMetrics {
    return {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      storageUtilization: 0,
      compressionEfficiency: 0,
      accessFrequency: 0,
      hotDataRatio: 0,
      memoryPressure: 0,
      errorRate: 0,
      lastUpdated: Date.now(),
      measurementPeriod: 60000 // 1 minute
    };
  }

  /**
   * Start performance monitoring with intelligent interval adjustment
   */
  startMonitoring(intervalMs?: number): void {
    if (this.isMonitoring) {
      return;
    }

    // Use config-based interval if not specified
    const monitoringInterval = intervalMs || cachePerformanceConfig.getCurrentMonitoringInterval();

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkForAutoOptimization();
      this.checkScheduledOptimization();
    }, monitoringInterval);

    console.log(`Cache performance monitoring started with ${monitoringInterval}ms interval`);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Cache performance monitoring stopped');
  }

  /**
   * Record a cache operation response time
   */
  recordResponseTime(timeMs: number): void {
    this.responseTimes.push(timeMs);

    // Keep only last 1000 measurements
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }
  }

  /**
   * Record a cache access
   */
  recordAccess(): void {
    const now = Date.now();
    this.accessCounts.push(now);

    // Keep only last hour of access data
    const oneHourAgo = now - 3600000;
    this.accessCounts = this.accessCounts.filter(time => time > oneHourAgo);
  }

  /**
   * Record a cache error
   */
  recordError(): void {
    const now = Date.now();
    this.errorCounts.push(now);

    // Keep only last hour of error data
    const oneHourAgo = now - 3600000;
    this.errorCounts = this.errorCounts.filter(time => time > oneHourAgo);
  }

  /**
   * Collect and calculate performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const cacheStats = await intelligentCacheService.getCacheStats();
      const now = Date.now();

      // Calculate response time metrics
      this.calculateResponseTimeMetrics();

      // Calculate cache efficiency metrics
      this.calculateCacheEfficiencyMetrics(cacheStats);

      // Calculate access pattern metrics
      this.calculateAccessPatternMetrics();

      // Calculate system health metrics
      this.calculateSystemHealthMetrics(cacheStats);

      // Update timestamp
      this.metrics.lastUpdated = now;

      // Check for performance alerts
      this.checkPerformanceAlerts();

    } catch (error) {
      console.error('Failed to collect cache performance metrics:', error);
      this.recordError();
    }
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(): void {
    if (this.responseTimes.length === 0) {
      return;
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);

    this.metrics.averageResponseTime =
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    this.metrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.metrics.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  /**
   * Calculate cache efficiency metrics
   */
  private calculateCacheEfficiencyMetrics(cacheStats: any): void {
    this.metrics.hitRate = cacheStats.health?.hitRate || 0;
    this.metrics.missRate = cacheStats.health?.missRate || 0;
    this.metrics.storageUtilization = cacheStats.health?.utilizationRate || 0;

    // Calculate compression efficiency
    if (cacheStats.compressionStats) {
      const { averageRatio, spaceSaved } = cacheStats.compressionStats;
      this.metrics.compressionEfficiency = 1 - averageRatio; // Higher is better
    }
  }

  /**
   * Calculate access pattern metrics
   */
  private calculateAccessPatternMetrics(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Calculate access frequency (per minute)
    const recentAccesses = this.accessCounts.filter(time => time > oneMinuteAgo);
    this.metrics.accessFrequency = recentAccesses.length;

    // Calculate hot data ratio (simplified)
    const cacheEntries = intelligentCacheService.getCacheEntries();
    const totalEntries = cacheEntries.size;

    if (totalEntries > 0) {
      const highPriorityEntries = Array.from(cacheEntries.values())
        .filter(entry => entry.priority > 0.7).length;
      this.metrics.hotDataRatio = highPriorityEntries / totalEntries;
    }
  }

  /**
   * Calculate system health metrics
   */
  private calculateSystemHealthMetrics(cacheStats: any): void {
    // Memory pressure based on storage utilization
    this.metrics.memoryPressure = Math.min(1, cacheStats.health?.utilizationRate * 1.2 || 0);

    // Error rate calculation
    const totalOperations = this.accessCounts.length + this.errorCounts.length;
    if (totalOperations > 0) {
      this.metrics.errorRate = (this.errorCounts.length / totalOperations) * 1000;
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(): void {
    const alerts: PerformanceAlert[] = [];

    // Response time alerts
    if (this.metrics.averageResponseTime > this.thresholds.responseTime.critical) {
      alerts.push(this.createAlert('critical', 'averageResponseTime',
        `Critical: Average response time is ${this.metrics.averageResponseTime.toFixed(1)}ms`));
    } else if (this.metrics.averageResponseTime > this.thresholds.responseTime.warning) {
      alerts.push(this.createAlert('warning', 'averageResponseTime',
        `Warning: Average response time is ${this.metrics.averageResponseTime.toFixed(1)}ms`));
    }

    // Hit rate alerts
    if (this.metrics.hitRate < this.thresholds.hitRate.critical) {
      alerts.push(this.createAlert('critical', 'hitRate',
        `Critical: Cache hit rate is ${(this.metrics.hitRate * 100).toFixed(1)}%`));
    } else if (this.metrics.hitRate < this.thresholds.hitRate.warning) {
      alerts.push(this.createAlert('warning', 'hitRate',
        `Warning: Cache hit rate is ${(this.metrics.hitRate * 100).toFixed(1)}%`));
    }

    // Storage utilization alerts
    if (this.metrics.storageUtilization > this.thresholds.storageUtilization.critical) {
      alerts.push(this.createAlert('critical', 'storageUtilization',
        `Critical: Storage utilization is ${(this.metrics.storageUtilization * 100).toFixed(1)}%`));
    } else if (this.metrics.storageUtilization > this.thresholds.storageUtilization.warning) {
      alerts.push(this.createAlert('warning', 'storageUtilization',
        `Warning: Storage utilization is ${(this.metrics.storageUtilization * 100).toFixed(1)}%`));
    }

    // Error rate alerts
    if (this.metrics.errorRate > this.thresholds.errorRate.critical) {
      alerts.push(this.createAlert('critical', 'errorRate',
        `Critical: Error rate is ${this.metrics.errorRate.toFixed(1)} per 1000 operations`));
    } else if (this.metrics.errorRate > this.thresholds.errorRate.warning) {
      alerts.push(this.createAlert('warning', 'errorRate',
        `Warning: Error rate is ${this.metrics.errorRate.toFixed(1)} per 1000 operations`));
    }

    // Add new alerts
    alerts.forEach(alert => {
      const existingAlert = this.alerts.find(a =>
        a.metric === alert.metric && a.type === alert.type && !a.resolved
      );

      if (!existingAlert) {
        this.alerts.push(alert);
        console.warn(`Cache Performance Alert: ${alert.message}`);
      }
    });

    // Resolve alerts that are no longer triggered
    this.alerts.forEach(alert => {
      if (!alert.resolved && !alerts.some(a => a.metric === alert.metric && a.type === alert.type)) {
        alert.resolved = true;
        console.info(`Cache Performance Alert Resolved: ${alert.message}`);
      }
    });
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    type: 'warning' | 'critical',
    metric: keyof CachePerformanceMetrics,
    message: string
  ): PerformanceAlert {
    return {
      id: `${metric}-${type}-${Date.now()}`,
      type,
      metric,
      threshold: this.getThreshold(metric, type),
      message,
      timestamp: Date.now(),
      resolved: false
    };
  }

  /**
   * Get threshold value for a metric
   */
  private getThreshold(metric: keyof CachePerformanceMetrics, type: 'warning' | 'critical'): number {
    switch (metric) {
      case 'averageResponseTime':
        return this.thresholds.responseTime[type];
      case 'hitRate':
        return this.thresholds.hitRate[type];
      case 'storageUtilization':
        return this.thresholds.storageUtilization[type];
      case 'errorRate':
        return this.thresholds.errorRate[type];
      default:
        return 0;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): CachePerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear resolved alerts older than specified time
   */
  clearOldAlerts(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - olderThanMs;
    this.alerts = this.alerts.filter(alert =>
      !alert.resolved || alert.timestamp > cutoff
    );
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    summary: string;
    metrics: CachePerformanceMetrics;
    activeAlerts: number;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.type === 'critical');

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let summary = 'Cache performance is optimal';

    if (criticalAlerts.length > 0) {
      status = 'critical';
      summary = `${criticalAlerts.length} critical performance issue(s) detected`;
    } else if (activeAlerts.length > 0) {
      status = 'warning';
      summary = `${activeAlerts.length} performance warning(s) detected`;
    }

    return {
      status,
      summary,
      metrics: this.getMetrics(),
      activeAlerts: activeAlerts.length
    };
  }

  /**
   * Update thresholds from configuration service
   */
  private updateThresholdsFromConfig(): void {
    const config = cachePerformanceConfig.getConfig();
    this.thresholds = {
      responseTime: config.thresholds.responseTime,
      hitRate: config.thresholds.hitRate,
      storageUtilization: config.thresholds.storageUtilization,
      errorRate: config.thresholds.errorRate
    };
  }

  /**
   * Check for automatic optimization triggers
   */
  private async checkForAutoOptimization(): Promise<void> {
    const config = cachePerformanceConfig.getConfig();

    if (!config.optimization.autoOptimizationEnabled) {
      return;
    }

    const triggers = config.optimization.optimizationTriggers;
    const shouldOptimize =
      this.metrics.hitRate < triggers.hitRateThreshold ||
      this.metrics.storageUtilization > triggers.storageUtilizationThreshold ||
      this.metrics.averageResponseTime > triggers.responseTimeThreshold;

    if (shouldOptimize) {
      console.log('Auto-optimization triggered based on performance metrics');
      try {
        await intelligentCacheService.forceOptimization();
        this.recordAccess(); // Record the optimization operation
      } catch (error) {
        console.error('Auto-optimization failed:', error);
        this.recordError();
      }
    }
  }

  /**
   * Check for scheduled optimization
   */
  private async checkScheduledOptimization(): Promise<void> {
    if (cachePerformanceConfig.shouldRunScheduledOptimization()) {
      console.log('Running scheduled cache optimization');
      try {
        await intelligentCacheService.forceOptimization();
        this.recordAccess();
      } catch (error) {
        console.error('Scheduled optimization failed:', error);
        this.recordError();
      }
    }
  }

  /**
   * Enable service mode optimizations
   */
  enableServiceModeOptimizations(): void {
    cachePerformanceConfig.setServiceModeOptimizations(true);

    // Increase monitoring frequency during service mode
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring(15000); // 15 seconds during service mode
    }

    console.log('Service mode optimizations enabled');
  }

  /**
   * Disable service mode optimizations
   */
  disableServiceModeOptimizations(): void {
    cachePerformanceConfig.setServiceModeOptimizations(false);

    // Return to normal monitoring frequency
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring(); // Use default config interval
    }

    console.log('Service mode optimizations disabled');
  }

  /**
   * Get Birch Lounge specific performance metrics
   */
  getBirchLoungeMetrics(): {
    searchResponseTimeCompliance: boolean;
    serviceModeActive: boolean;
    mobileOptimized: boolean;
    offlineReady: boolean;
  } {
    const config = cachePerformanceConfig.getBirchLoungeSettings();

    return {
      searchResponseTimeCompliance: this.metrics.averageResponseTime <= config.searchResponseTimeTarget,
      serviceModeActive: config.serviceModeOptimizations,
      mobileOptimized: config.mobilePerformanceMode,
      offlineReady: config.offlineCompatibility
    };
  }
}

// Export singleton instance
export const cachePerformanceMonitor = new CachePerformanceMonitor();
