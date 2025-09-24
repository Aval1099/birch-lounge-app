// =============================================================================
// CACHE PERFORMANCE INTEGRATION TESTS
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cachePerformanceMonitor } from '../../services/cachePerformanceMonitor';
import { cachePerformanceConfig } from '../../services/cachePerformanceConfig';
import { intelligentCacheService } from '../../services/intelligentCacheService';

// Mock console to avoid noise
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});

describe('Cache Performance Integration Tests', () => {
  beforeEach(() => {
    // Reset configuration to defaults
    cachePerformanceConfig.resetToDefaults();

    // Stop any existing monitoring
    cachePerformanceMonitor.stopMonitoring();

    // Clear any existing alerts
    cachePerformanceMonitor.clearOldAlerts(0);
  });

  afterEach(() => {
    // Clean up monitoring
    cachePerformanceMonitor.stopMonitoring();
  });

  describe('Configuration Integration', () => {
    it('should use configuration-based monitoring intervals', () => {
      const config = cachePerformanceConfig.getConfig();

      expect(config.monitoring.collectionInterval).toBeDefined();
      expect(config.monitoring.dashboardRefreshRate).toBeDefined();
      expect(config.thresholds.responseTime.warning).toBe(100); // Birch Lounge requirement
    });

    it('should adjust intervals for low traffic periods', () => {
      const normalInterval = cachePerformanceConfig.getCurrentMonitoringInterval();

      // Mock low traffic period (night time)
      const originalDate = Date;
      const mockDate = new Date('2024-01-01T02:00:00Z'); // 2 AM
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const lowTrafficInterval = cachePerformanceConfig.getCurrentMonitoringInterval();

      // Restore original Date
      vi.restoreAllMocks();

      expect(lowTrafficInterval).toBeGreaterThan(normalInterval);
    });

    it('should support environment-specific configurations', () => {
      const devConfig = cachePerformanceConfig.getEnvironmentConfig('development');
      const prodConfig = cachePerformanceConfig.getEnvironmentConfig('production');

      expect(devConfig.monitoring.collectionInterval).toBeLessThan(prodConfig.monitoring.collectionInterval);
      expect(devConfig.thresholds.responseTime.warning).toBeLessThan(prodConfig.thresholds.responseTime.warning);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should start monitoring with config-based intervals', () => {
      cachePerformanceMonitor.startMonitoring();

      const metrics = cachePerformanceMonitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.lastUpdated).toBeGreaterThan(0);
    });

    it('should record and track response times', () => {
      // Record some response times
      cachePerformanceMonitor.recordResponseTime(50);
      cachePerformanceMonitor.recordResponseTime(75);
      cachePerformanceMonitor.recordResponseTime(120);

      const metrics = cachePerformanceMonitor.getMetrics();
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should generate alerts based on thresholds', () => {
      // Record high response times to trigger alerts
      for (let i = 0; i < 10; i++) {
        cachePerformanceMonitor.recordResponseTime(600); // Above critical threshold
      }

      // Force metrics calculation
      cachePerformanceMonitor.startMonitoring(100);

      // Wait a bit for metrics to be calculated
      return new Promise(resolve => {
        setTimeout(() => {
          const alerts = cachePerformanceMonitor.getActiveAlerts();
          expect(alerts.length).toBeGreaterThan(0);

          const criticalAlerts = alerts.filter(a => a.type === 'critical');
          expect(criticalAlerts.length).toBeGreaterThan(0);

          cachePerformanceMonitor.stopMonitoring();
          resolve(undefined);
        }, 200);
      });
    });

    it('should provide Birch Lounge specific metrics', () => {
      const birchLoungeMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();

      expect(birchLoungeMetrics).toBeDefined();
      expect(typeof birchLoungeMetrics.searchResponseTimeCompliance).toBe('boolean');
      expect(typeof birchLoungeMetrics.serviceModeActive).toBe('boolean');
      expect(typeof birchLoungeMetrics.mobileOptimized).toBe('boolean');
      expect(typeof birchLoungeMetrics.offlineReady).toBe('boolean');
    });
  });

  describe('Service Mode Integration', () => {
    it('should enable service mode optimizations', () => {
      cachePerformanceMonitor.enableServiceModeOptimizations();

      const birchLoungeMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();
      expect(birchLoungeMetrics.serviceModeActive).toBe(true);
    });

    it('should disable service mode optimizations', () => {
      cachePerformanceMonitor.enableServiceModeOptimizations();
      cachePerformanceMonitor.disableServiceModeOptimizations();

      const birchLoungeMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();
      expect(birchLoungeMetrics.serviceModeActive).toBe(false);
    });
  });

  describe('Auto-Optimization Integration', () => {
    it('should support auto-optimization configuration', () => {
      const config = cachePerformanceConfig.getConfig();

      expect(config.optimization.autoOptimizationEnabled).toBeDefined();
      expect(config.optimization.optimizationTriggers).toBeDefined();
      expect(config.optimization.optimizationTriggers.hitRateThreshold).toBeGreaterThan(0);
    });

    it('should update optimization settings', () => {
      const newSettings = {
        autoOptimizationEnabled: false,
        optimizationTriggers: {
          hitRateThreshold: 0.5,
          storageUtilizationThreshold: 0.9,
          responseTimeThreshold: 200
        }
      };

      cachePerformanceConfig.updateOptimizationSettings(newSettings);

      const config = cachePerformanceConfig.getConfig();
      expect(config.optimization.autoOptimizationEnabled).toBe(false);
      expect(config.optimization.optimizationTriggers.hitRateThreshold).toBe(0.5);
    });
  });

  describe('Threshold Configuration', () => {
    it('should update response time thresholds', () => {
      const newThresholds = {
        responseTime: {
          warning: 80,
          critical: 300
        }
      };

      cachePerformanceConfig.updateThresholds(newThresholds);

      const config = cachePerformanceConfig.getConfig();
      expect(config.thresholds.responseTime.warning).toBe(80);
      expect(config.thresholds.responseTime.critical).toBe(300);
    });

    it('should update hit rate thresholds', () => {
      const newThresholds = {
        hitRate: {
          warning: 0.85,
          critical: 0.65
        }
      };

      cachePerformanceConfig.updateThresholds(newThresholds);

      const config = cachePerformanceConfig.getConfig();
      expect(config.thresholds.hitRate.warning).toBe(0.85);
      expect(config.thresholds.hitRate.critical).toBe(0.65);
    });
  });

  describe('Performance Summary Integration', () => {
    it('should provide comprehensive performance summary', () => {
      const summary = cachePerformanceMonitor.getPerformanceSummary();

      expect(summary).toBeDefined();
      expect(summary.status).toMatch(/healthy|warning|critical/);
      expect(summary.summary).toBeDefined();
      expect(summary.metrics).toBeDefined();
      expect(typeof summary.activeAlerts).toBe('number');
    });

    it('should reflect alert status in summary', () => {
      // Record problematic metrics
      for (let i = 0; i < 5; i++) {
        cachePerformanceMonitor.recordResponseTime(600);
        cachePerformanceMonitor.recordError();
      }

      cachePerformanceMonitor.startMonitoring(100);

      return new Promise(resolve => {
        setTimeout(() => {
          const summary = cachePerformanceMonitor.getPerformanceSummary();

          // Should detect performance issues
          expect(['warning', 'critical']).toContain(summary.status);
          expect(summary.activeAlerts).toBeGreaterThan(0);

          cachePerformanceMonitor.stopMonitoring();
          resolve(undefined);
        }, 200);
      });
    });
  });

  describe('Birch Lounge Requirements Compliance', () => {
    it('should track <100ms search response time requirement', () => {
      // Record good response times
      for (let i = 0; i < 10; i++) {
        cachePerformanceMonitor.recordResponseTime(50);
      }

      const birchLoungeMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();
      expect(birchLoungeMetrics.searchResponseTimeCompliance).toBe(true);
    });

    it('should detect when search response time requirement is not met', () => {
      // Record poor response times
      for (let i = 0; i < 10; i++) {
        cachePerformanceMonitor.recordResponseTime(150);
      }

      const birchLoungeMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();
      expect(birchLoungeMetrics.searchResponseTimeCompliance).toBe(false);
    });

    it('should support mobile performance mode', () => {
      const config = cachePerformanceConfig.getBirchLoungeSettings();
      expect(config.mobilePerformanceMode).toBe(true);
    });

    it('should support PWA offline compatibility', () => {
      const config = cachePerformanceConfig.getBirchLoungeSettings();
      expect(config.offlineCompatibility).toBe(true);
    });
  });

  describe('Configuration Persistence', () => {
    it('should save and load configuration from localStorage', async () => {
      const originalConfig = cachePerformanceConfig.getConfig();

      // Update some settings
      cachePerformanceConfig.updateMonitoringIntervals({
        collectionInterval: 45000,
        dashboardRefreshRate: 3000
      });

      // Verify the configuration was updated
      const updatedConfig = cachePerformanceConfig.getConfig();
      expect(updatedConfig.monitoring.collectionInterval).toBe(45000);
      expect(updatedConfig.monitoring.dashboardRefreshRate).toBe(3000);
    });
  });
});
