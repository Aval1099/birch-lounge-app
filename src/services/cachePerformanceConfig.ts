// =============================================================================
// CACHE PERFORMANCE CONFIGURATION SERVICE
// =============================================================================

/**
 * Configuration interface for cache performance monitoring
 */
export interface CachePerformanceConfig {
  // Monitoring intervals (in milliseconds)
  monitoring: {
    collectionInterval: number;    // How often to collect metrics
    dashboardRefreshRate: number;  // How often dashboard updates
    metricsRetentionPeriod: number; // How long to keep metrics data
    lowTrafficInterval: number;    // Reduced frequency during low traffic
  };

  // Performance alert thresholds
  thresholds: {
    responseTime: {
      warning: number;   // ms
      critical: number;  // ms
    };
    hitRate: {
      warning: number;   // 0-1 ratio
      critical: number;  // 0-1 ratio
    };
    storageUtilization: {
      warning: number;   // 0-1 ratio
      critical: number;  // 0-1 ratio
    };
    errorRate: {
      warning: number;   // errors per 1000 operations
      critical: number;  // errors per 1000 operations
    };
    memoryPressure: {
      warning: number;   // 0-1 ratio
      critical: number;  // 0-1 ratio
    };
  };

  // Optimization settings
  optimization: {
    autoOptimizationEnabled: boolean;
    optimizationTriggers: {
      hitRateThreshold: number;      // Trigger optimization if hit rate drops below
      storageUtilizationThreshold: number; // Trigger optimization if storage exceeds
      responseTimeThreshold: number; // Trigger optimization if response time exceeds
    };
    scheduledOptimization: {
      enabled: boolean;
      time: string; // HH:MM format for daily optimization
      timezone: string;
    };
  };

  // Birch Lounge specific requirements
  birchLounge: {
    searchResponseTimeTarget: number; // <100ms requirement
    serviceModeOptimizations: boolean; // Enhanced performance during service mode
    mobilePerformanceMode: boolean;   // Optimizations for mobile devices
    offlineCompatibility: boolean;    // Ensure cache works with PWA offline mode
  };
}

/**
 * Default configuration optimized for Birch Lounge application
 */
const DEFAULT_CONFIG: CachePerformanceConfig = {
  monitoring: {
    collectionInterval: 30000,      // 30 seconds for production
    dashboardRefreshRate: 5000,     // 5 seconds for real-time updates
    metricsRetentionPeriod: 86400000, // 24 hours
    lowTrafficInterval: 60000,      // 1 minute during low traffic
  },

  thresholds: {
    responseTime: {
      warning: 100,   // Warning at 100ms (Birch Lounge target)
      critical: 500   // Critical at 500ms
    },
    hitRate: {
      warning: 0.8,   // Warning below 80%
      critical: 0.6   // Critical below 60%
    },
    storageUtilization: {
      warning: 0.8,   // Warning at 80%
      critical: 0.95  // Critical at 95%
    },
    errorRate: {
      warning: 10,    // Warning at 10 errors per 1000 operations
      critical: 50    // Critical at 50 errors per 1000 operations
    },
    memoryPressure: {
      warning: 0.75,  // Warning at 75%
      critical: 0.9   // Critical at 90%
    }
  },

  optimization: {
    autoOptimizationEnabled: true,
    optimizationTriggers: {
      hitRateThreshold: 0.7,        // Optimize if hit rate drops below 70%
      storageUtilizationThreshold: 0.85, // Optimize if storage exceeds 85%
      responseTimeThreshold: 150    // Optimize if response time exceeds 150ms
    },
    scheduledOptimization: {
      enabled: true,
      time: "03:00",               // 3 AM daily optimization
      timezone: "America/New_York" // Adjust based on restaurant location
    }
  },

  birchLounge: {
    searchResponseTimeTarget: 100,  // <100ms search response requirement
    serviceModeOptimizations: true, // Enhanced performance during service
    mobilePerformanceMode: true,    // Mobile-first optimizations
    offlineCompatibility: true     // PWA offline support
  }
};

/**
 * Development configuration with more frequent monitoring
 */
const DEVELOPMENT_CONFIG: Partial<CachePerformanceConfig> = {
  monitoring: {
    collectionInterval: 5000,       // 5 seconds for development
    dashboardRefreshRate: 2000,     // 2 seconds for development
    metricsRetentionPeriod: 3600000, // 1 hour for development
    lowTrafficInterval: 10000,      // 10 seconds during low traffic
  },

  thresholds: {
    responseTime: {
      warning: 50,    // Stricter in development
      critical: 200   // Stricter in development
    },
    hitRate: {
      warning: 0.9,   // Higher expectations in development
      critical: 0.7   // Higher expectations in development
    },
    storageUtilization: {
      warning: 0.7,   // Lower threshold in development
      critical: 0.9   // Lower threshold in development
    },
    errorRate: {
      warning: 5,     // Stricter in development
      critical: 20    // Stricter in development
    },
    memoryPressure: {
      warning: 0.6,   // Lower threshold in development
      critical: 0.8   // Lower threshold in development
    }
  }
};

/**
 * Cache Performance Configuration Service
 */
class CachePerformanceConfigService {
  private config: CachePerformanceConfig;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    this.config = this.mergeConfigs(DEFAULT_CONFIG, this.isDevelopment ? DEVELOPMENT_CONFIG : {});
    
    // Load any saved configuration from localStorage
    this.loadSavedConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): CachePerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CachePerformanceConfig>): void {
    this.config = this.mergeConfigs(this.config, updates);
    this.saveConfig();
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = this.mergeConfigs(DEFAULT_CONFIG, this.isDevelopment ? DEVELOPMENT_CONFIG : {});
    this.saveConfig();
  }

  /**
   * Get configuration for specific environment
   */
  getEnvironmentConfig(environment: 'development' | 'production'): CachePerformanceConfig {
    const baseConfig = DEFAULT_CONFIG;
    if (environment === 'development') {
      return this.mergeConfigs(baseConfig, DEVELOPMENT_CONFIG);
    }
    return baseConfig;
  }

  /**
   * Update monitoring intervals
   */
  updateMonitoringIntervals(intervals: Partial<CachePerformanceConfig['monitoring']>): void {
    this.config.monitoring = { ...this.config.monitoring, ...intervals };
    this.saveConfig();
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: Partial<CachePerformanceConfig['thresholds']>): void {
    this.config.thresholds = this.mergeConfigs(this.config.thresholds, thresholds);
    this.saveConfig();
  }

  /**
   * Update optimization settings
   */
  updateOptimizationSettings(optimization: Partial<CachePerformanceConfig['optimization']>): void {
    this.config.optimization = this.mergeConfigs(this.config.optimization, optimization);
    this.saveConfig();
  }

  /**
   * Check if current time is during low traffic period
   */
  isLowTrafficPeriod(): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    // Consider 11 PM to 6 AM as low traffic for restaurants
    return hour >= 23 || hour <= 6;
  }

  /**
   * Get appropriate monitoring interval based on traffic
   */
  getCurrentMonitoringInterval(): number {
    return this.isLowTrafficPeriod() 
      ? this.config.monitoring.lowTrafficInterval 
      : this.config.monitoring.collectionInterval;
  }

  /**
   * Check if scheduled optimization should run
   */
  shouldRunScheduledOptimization(): boolean {
    if (!this.config.optimization.scheduledOptimization.enabled) {
      return false;
    }

    const now = new Date();
    const [targetHour, targetMinute] = this.config.optimization.scheduledOptimization.time.split(':').map(Number);
    
    return now.getHours() === targetHour && now.getMinutes() === targetMinute;
  }

  /**
   * Get Birch Lounge specific settings
   */
  getBirchLoungeSettings(): CachePerformanceConfig['birchLounge'] {
    return { ...this.config.birchLounge };
  }

  /**
   * Enable/disable service mode optimizations
   */
  setServiceModeOptimizations(enabled: boolean): void {
    this.config.birchLounge.serviceModeOptimizations = enabled;
    this.saveConfig();
  }

  /**
   * Merge configuration objects deeply
   */
  private mergeConfigs<T>(base: T, updates: Partial<T>): T {
    const result = { ...base };
    
    for (const key in updates) {
      if (updates[key] !== undefined) {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
          result[key] = this.mergeConfigs(result[key] as any, updates[key] as any);
        } else {
          result[key] = updates[key] as any;
        }
      }
    }
    
    return result;
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('cache-performance-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save cache performance configuration:', error);
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadSavedConfig(): void {
    try {
      const saved = localStorage.getItem('cache-performance-config');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        this.config = this.mergeConfigs(this.config, savedConfig);
      }
    } catch (error) {
      console.warn('Failed to load saved cache performance configuration:', error);
    }
  }
}

// Export singleton instance
export const cachePerformanceConfig = new CachePerformanceConfigService();
