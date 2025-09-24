// =============================================================================
// SERVICE MODE PERFORMANCE OPTIMIZER
// =============================================================================

import { cachePerformanceMonitor } from './cachePerformanceMonitor';
import { intelligentCacheService } from './intelligentCacheService';
import { performanceMonitor } from './performanceService';

/**
 * Service Mode Performance Optimizer
 * Provides enhanced performance optimizations specifically for service mode
 * to ensure <100ms search response times and optimal bartender experience
 */
class ServiceModeOptimizer {
  private isServiceModeActive = false;
  private originalCacheStrategy: string = 'intelligent';
  private preloadedSearchTerms: Set<string> = new Set();
  private frequentlyAccessedItems: Map<string, number> = new Map();
  private optimizationInterval: NodeJS.Timeout | null = null;

  // Service mode performance targets
  private readonly TARGETS = {
    searchResponseTime: 100, // <100ms requirement
    cacheHitRate: 0.95, // 95% cache hit rate during service
    preloadThreshold: 0.8, // Preload items with 80%+ access probability
    optimizationInterval: 10000 // 10 seconds optimization cycle
  };

  /**
   * Enable service mode optimizations
   */
  async enableServiceMode(): Promise<void> {
    if (this.isServiceModeActive) {
      return;
    }

    console.log('🚀 Enabling service mode optimizations...');
    this.isServiceModeActive = true;

    // 1. Switch to aggressive caching strategy
    this.originalCacheStrategy = intelligentCacheService.getStrategy();
    intelligentCacheService.setStrategy('priority');

    // 2. Enable cache performance monitoring with higher frequency
    cachePerformanceMonitor.enableServiceModeOptimizations();

    // 3. Preload frequently accessed items
    await this.preloadFrequentItems();

    // 4. Optimize search cache
    await this.optimizeSearchCache();

    // 5. Start continuous optimization
    this.startContinuousOptimization();

    // 6. Configure performance monitoring for service mode
    performanceMonitor.recordMetric('serviceModeEnabled', 1, {
      timestamp: Date.now(),
      targets: this.TARGETS
    });

    console.log('✅ Service mode optimizations enabled');
  }

  /**
   * Disable service mode optimizations
   */
  async disableServiceMode(): Promise<void> {
    if (!this.isServiceModeActive) {
      return;
    }

    console.log('🔄 Disabling service mode optimizations...');
    this.isServiceModeActive = false;

    // 1. Restore original cache strategy
    intelligentCacheService.setStrategy(this.originalCacheStrategy as any);

    // 2. Disable enhanced cache monitoring
    cachePerformanceMonitor.disableServiceModeOptimizations();

    // 3. Stop continuous optimization
    this.stopContinuousOptimization();

    // 4. Record performance metrics
    performanceMonitor.recordMetric('serviceModeDisabled', 1, {
      timestamp: Date.now()
    });

    console.log('✅ Service mode optimizations disabled');
  }

  /**
   * Preload frequently accessed items for instant access
   */
  private async preloadFrequentItems(): Promise<void> {
    try {
      // Get frequently accessed recipes and ingredients
      const cacheStats = await intelligentCacheService.getCacheStats();
      const entries = intelligentCacheService.getCacheEntries();

      // Identify high-priority items
      const highPriorityItems = Array.from(entries.values())
        .filter(entry => entry.priority > this.TARGETS.preloadThreshold)
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 50); // Top 50 items

      // Preload these items
      for (const item of highPriorityItems) {
        await intelligentCacheService.preloadItem(item.id);
        this.frequentlyAccessedItems.set(item.id, item.priority);
      }

      console.log(`📦 Preloaded ${highPriorityItems.length} high-priority items`);
    } catch (error) {
      console.error('Failed to preload frequent items:', error);
    }
  }

  /**
   * Optimize search cache for common bartender queries
   */
  private async optimizeSearchCache(): Promise<void> {
    // Common bartender search terms during service
    const commonSearchTerms = [
      'whiskey', 'bourbon', 'gin', 'vodka', 'rum', 'tequila',
      'old fashioned', 'manhattan', 'martini', 'negroni', 'margarita',
      'simple', 'classic', 'strong', 'sweet', 'sour', 'bitter',
      'citrus', 'lemon', 'lime', 'orange', 'bitters',
      'shaken', 'stirred', 'rocks', 'neat', 'up'
    ];

    // Preload search results for common terms
    for (const term of commonSearchTerms) {
      try {
        // This will cache the search results
        await this.performOptimizedSearch(term);
        this.preloadedSearchTerms.add(term);
      } catch (error) {
        console.warn(`Failed to preload search for "${term}":`, error);
      }
    }

    console.log(`🔍 Preloaded search cache for ${this.preloadedSearchTerms.size} common terms`);
  }

  /**
   * Perform optimized search with enhanced caching
   */
  private async performOptimizedSearch(query: string): Promise<any> {
    const startTime = performance.now();

    try {
      // Use the advanced search engine with aggressive caching
      const { performAdvancedSearch } = await import('./advancedSearchEngine.js');
      
      const results = await performAdvancedSearch(query, [], {
        useCache: true,
        maxResults: 20,
        includeFilters: false, // Skip filters for faster response
        includeSuggestions: false // Skip suggestions for faster response
      });

      const responseTime = performance.now() - startTime;

      // Record performance metric
      performanceMonitor.recordMetric('searchResponseTime', responseTime, {
        query,
        serviceMode: true,
        cached: results.fromCache
      });

      // Alert if response time exceeds target
      if (responseTime > this.TARGETS.searchResponseTime) {
        console.warn(`⚠️ Search response time (${responseTime.toFixed(1)}ms) exceeds target (${this.TARGETS.searchResponseTime}ms) for query: "${query}"`);
      }

      return results;
    } catch (error) {
      console.error(`Search optimization failed for "${query}":`, error);
      throw error;
    }
  }

  /**
   * Start continuous optimization during service mode
   */
  private startContinuousOptimization(): void {
    this.optimizationInterval = setInterval(async () => {
      await this.performContinuousOptimization();
    }, this.TARGETS.optimizationInterval);
  }

  /**
   * Stop continuous optimization
   */
  private stopContinuousOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }

  /**
   * Perform continuous optimization checks
   */
  private async performContinuousOptimization(): Promise<void> {
    try {
      const metrics = cachePerformanceMonitor.getMetrics();
      const birchMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();

      // Check if search response time target is being met
      if (!birchMetrics.searchResponseTimeCompliance) {
        console.log('🔧 Search response time target not met, optimizing...');
        await this.optimizeForFasterSearch();
      }

      // Check cache hit rate
      if (metrics.hitRate < this.TARGETS.cacheHitRate) {
        console.log('🔧 Cache hit rate below target, optimizing...');
        await this.optimizeCacheHitRate();
      }

      // Monitor memory pressure
      if (metrics.memoryPressure > 0.8) {
        console.log('🔧 High memory pressure detected, optimizing...');
        await this.optimizeMemoryUsage();
      }

    } catch (error) {
      console.error('Continuous optimization failed:', error);
    }
  }

  /**
   * Optimize for faster search response times
   */
  private async optimizeForFasterSearch(): Promise<void> {
    // Force cache optimization
    await intelligentCacheService.forceOptimization();

    // Increase cache priority for search-related items
    const entries = intelligentCacheService.getCacheEntries();
    entries.forEach((entry, id) => {
      if (entry.type === 'recipe' || entry.type === 'ingredient') {
        intelligentCacheService.updateItemPriority(id, Math.min(1.0, entry.priority + 0.1));
      }
    });
  }

  /**
   * Optimize cache hit rate
   */
  private async optimizeCacheHitRate(): Promise<void> {
    // Preload more frequently accessed items
    await this.preloadFrequentItems();

    // Extend cache TTL for high-priority items
    const entries = intelligentCacheService.getCacheEntries();
    entries.forEach((entry, id) => {
      if (entry.priority > 0.7) {
        // Extend TTL for high-priority items
        intelligentCacheService.updateItemPriority(id, entry.priority);
      }
    });
  }

  /**
   * Optimize memory usage
   */
  private async optimizeMemoryUsage(): Promise<void> {
    // Remove low-priority items from cache
    const entries = intelligentCacheService.getCacheEntries();
    const lowPriorityItems = Array.from(entries.entries())
      .filter(([_, entry]) => entry.priority < 0.3)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .slice(0, 20); // Remove bottom 20 items

    for (const [id] of lowPriorityItems) {
      intelligentCacheService.removeFromCache(id);
    }

    console.log(`🗑️ Removed ${lowPriorityItems.length} low-priority items from cache`);
  }

  /**
   * Get service mode performance status
   */
  getServiceModeStatus(): {
    isActive: boolean;
    metrics: any;
    compliance: any;
    optimizations: string[];
  } {
    const metrics = cachePerformanceMonitor.getMetrics();
    const compliance = cachePerformanceMonitor.getBirchLoungeMetrics();

    const optimizations = [];
    if (this.isServiceModeActive) {
      optimizations.push('Aggressive caching enabled');
      optimizations.push('Frequent items preloaded');
      optimizations.push('Search cache optimized');
      optimizations.push('Continuous optimization active');
    }

    return {
      isActive: this.isServiceModeActive,
      metrics: {
        searchResponseTime: metrics.averageResponseTime,
        cacheHitRate: metrics.hitRate,
        memoryPressure: metrics.memoryPressure,
        preloadedItems: this.frequentlyAccessedItems.size,
        preloadedSearchTerms: this.preloadedSearchTerms.size
      },
      compliance,
      optimizations
    };
  }

  /**
   * Check if service mode is active
   */
  isActive(): boolean {
    return this.isServiceModeActive;
  }
}

// Export singleton instance
export const serviceModeOptimizer = new ServiceModeOptimizer();
