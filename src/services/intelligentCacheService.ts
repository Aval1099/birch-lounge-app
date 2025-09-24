// =============================================================================
// INTELLIGENT CACHE MANAGEMENT SERVICE
// =============================================================================

import type { OfflineStorageStats } from '../types/offline';
import { offlineStorage } from './offlineStorageService';

/**
 * Cache entry metadata for intelligent management
 */
interface CacheEntry {
  id: string;
  type: 'recipe' | 'ingredient' | 'technique' | 'menu' | 'image';
  size: number;
  lastAccessed: number;
  accessCount: number;
  priority: number; // 0-1, higher = more important
  dependencies: string[];
  tags: string[];
  expiresAt?: number;
  isStale: boolean;
  compressionRatio?: number;
}

/**
 * Cache optimization strategy
 */
export type CacheStrategy = 'lru' | 'lfu' | 'priority' | 'intelligent' | 'size-based';

/**
 * Cache health metrics
 */
interface CacheHealth {
  hitRate: number;
  missRate: number;
  stalenessRate: number;
  fragmentationRate: number;
  utilizationRate: number;
  averageAccessTime: number;
}

/**
 * Cache prediction model
 */
interface CachePrediction {
  itemId: string;
  predictedAccess: number; // timestamp
  confidence: number; // 0-1
  reason: string;
}

/**
 * Intelligent Cache Management Service
 * Provides advanced caching strategies, predictive prefetching, and automatic optimization
 */
class IntelligentCacheService {
  private cacheEntries: Map<string, CacheEntry> = new Map();
  private accessHistory: Array<{ itemId: string; timestamp: number }> = [];
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB default
  private maxEntries: number = 10000;
  private strategy: CacheStrategy = 'intelligent';
  private compressionEnabled = true;
  private predictiveEnabled = true;

  constructor() {
    this.initializeCacheMonitoring();
    this.startPeriodicOptimization();
  }

  /**
   * Initialize cache monitoring and metadata collection
   */
  private async initializeCacheMonitoring(): Promise<void> {
    try {
      // Load existing cache metadata
      await this.loadCacheMetadata();

      // Start access pattern tracking
      this.startAccessTracking();
    } catch (error) {
      console.error('Failed to initialize cache monitoring:', error);
    }
  }

  /**
   * Load cache metadata from storage
   */
  private async loadCacheMetadata(): Promise<void> {
    const [recipes, ingredients, techniques, menus] = await Promise.all([
      offlineStorage.getCachedRecipes(),
      offlineStorage.getCachedIngredients(),
      offlineStorage.getCachedTechniques(),
      offlineStorage.getCachedMenus()
    ]);

    // Create cache entries for all stored items
    [...recipes, ...ingredients, ...techniques, ...menus].forEach(item => {
      const jsonString = JSON.stringify(item);
      const compressionRatio = this.compressionEnabled ? this.calculateCompressionRatio(jsonString) : 1.0;

      const entry: CacheEntry = {
        id: item.id,
        type: this.getItemType(item),
        size: this.estimateItemSize(item),
        lastAccessed: item.lastSyncedAt || Date.now(),
        accessCount: 1,
        priority: this.calculateInitialPriority(item),
        dependencies: this.extractDependencies(item),
        tags: this.extractTags(item),
        isStale: this.isItemStale(item),
        compressionRatio
      };

      this.cacheEntries.set(item.id, entry);
    });
  }

  /**
   * Start access pattern tracking
   */
  private startAccessTracking(): void {
    // Intercept storage access to track usage patterns
    const originalGet = offlineStorage.getCachedRecipe.bind(offlineStorage);

    offlineStorage.getCachedRecipe = async (id: string) => {
      this.recordAccess(id);
      return originalGet(id);
    };
  }

  /**
   * Record item access for pattern analysis
   */
  private recordAccess(itemId: string): void {
    const timestamp = Date.now();

    // Update cache entry
    const entry = this.cacheEntries.get(itemId);
    if (entry) {
      entry.lastAccessed = timestamp;
      entry.accessCount++;
      entry.priority = this.recalculatePriority(entry);
    }

    // Add to access history
    this.accessHistory.push({ itemId, timestamp });

    // Limit history size
    if (this.accessHistory.length > 10000) {
      this.accessHistory = this.accessHistory.slice(-5000);
    }

    // Trigger predictive prefetching
    if (this.predictiveEnabled) {
      this.triggerPredictivePrefetch(itemId);
    }
  }

  /**
   * Calculate initial priority for cache entry
   */
  private calculateInitialPriority(item: any): number {
    let priority = 0.5; // Base priority

    // Boost priority for frequently used items
    if (item.timesOrdered && item.timesOrdered > 10) {
      priority += 0.2;
    }

    // Boost priority for favorites
    if (item.isFavorite) {
      priority += 0.15;
    }

    // Boost priority for recently accessed items
    if (item.lastMade) {
      const daysSinceAccess = (Date.now() - new Date(item.lastMade).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAccess < 7) {
        priority += 0.1;
      }
    }

    // Boost priority for high-rated items
    if (item.rating && item.rating >= 4) {
      priority += 0.1;
    }

    return Math.min(1.0, priority);
  }

  /**
   * Recalculate priority based on access patterns
   */
  private recalculatePriority(entry: CacheEntry): number {
    const now = Date.now();
    const daysSinceAccess = (now - entry.lastAccessed) / (1000 * 60 * 60 * 24);

    let priority = 0.5;

    // Frequency component
    const accessFrequency = entry.accessCount / Math.max(1, daysSinceAccess);
    priority += Math.min(0.3, accessFrequency * 0.1);

    // Recency component
    if (daysSinceAccess < 1) priority += 0.2;
    else if (daysSinceAccess < 7) priority += 0.1;
    else if (daysSinceAccess > 30) priority -= 0.2;

    // Size efficiency component (smaller items get slight boost)
    if (entry.size < 1024) priority += 0.05;
    else if (entry.size > 10240) priority -= 0.05;

    // Dependency component (items with many dependents get boost)
    const dependentCount = this.getDependentCount(entry.id);
    priority += Math.min(0.15, dependentCount * 0.03);

    return Math.max(0.1, Math.min(1.0, priority));
  }

  /**
   * Get count of items that depend on this entry
   */
  private getDependentCount(itemId: string): number {
    return Array.from(this.cacheEntries.values())
      .filter(entry => entry.dependencies.includes(itemId))
      .length;
  }

  /**
   * Trigger predictive prefetching based on access patterns
   */
  private async triggerPredictivePrefetch(accessedItemId: string): Promise<void> {
    const predictions = this.generatePredictions(accessedItemId);

    for (const prediction of predictions) {
      if (prediction.confidence > 0.7 && !this.cacheEntries.has(prediction.itemId)) {
        // Prefetch high-confidence predictions
        await this.prefetchItem(prediction.itemId);
      }
    }
  }

  /**
   * Generate access predictions based on patterns
   */
  private generatePredictions(accessedItemId: string): CachePrediction[] {
    const predictions: CachePrediction[] = [];
    const accessedEntry = this.cacheEntries.get(accessedItemId);

    if (!accessedEntry) return predictions;

    // Pattern 1: Items frequently accessed together
    const coAccessedItems = this.findCoAccessedItems(accessedItemId);
    coAccessedItems.forEach(({ itemId, confidence }) => {
      predictions.push({
        itemId,
        predictedAccess: Date.now() + 300000, // 5 minutes
        confidence,
        reason: 'Frequently accessed together'
      });
    });

    // Pattern 2: Sequential access patterns
    const sequentialItems = this.findSequentialItems(accessedItemId);
    sequentialItems.forEach(({ itemId, confidence }) => {
      predictions.push({
        itemId,
        predictedAccess: Date.now() + 600000, // 10 minutes
        confidence,
        reason: 'Sequential access pattern'
      });
    });

    // Pattern 3: Dependency-based predictions
    accessedEntry.dependencies.forEach(depId => {
      if (!this.cacheEntries.has(depId)) {
        predictions.push({
          itemId: depId,
          predictedAccess: Date.now() + 180000, // 3 minutes
          confidence: 0.8,
          reason: 'Required dependency'
        });
      }
    });

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find items frequently accessed together
   */
  private findCoAccessedItems(itemId: string): Array<{ itemId: string; confidence: number }> {
    const coAccessed: Map<string, number> = new Map();
    const timeWindow = 30 * 60 * 1000; // 30 minutes

    // Find access sessions for the given item
    const itemAccesses = this.accessHistory.filter(access => access.itemId === itemId);

    itemAccesses.forEach(access => {
      // Find other items accessed within the time window
      const sessionAccesses = this.accessHistory.filter(other =>
        other.itemId !== itemId &&
        Math.abs(other.timestamp - access.timestamp) <= timeWindow
      );

      sessionAccesses.forEach(sessionAccess => {
        const count = coAccessed.get(sessionAccess.itemId) || 0;
        coAccessed.set(sessionAccess.itemId, count + 1);
      });
    });

    // Calculate confidence based on co-access frequency
    const totalSessions = itemAccesses.length;
    return Array.from(coAccessed.entries())
      .map(([itemId, count]) => ({
        itemId,
        confidence: Math.min(0.9, count / totalSessions)
      }))
      .filter(item => item.confidence > 0.3)
      .slice(0, 5);
  }

  /**
   * Find items in sequential access patterns
   */
  private findSequentialItems(itemId: string): Array<{ itemId: string; confidence: number }> {
    const sequential: Map<string, number> = new Map();
    const maxGap = 5 * 60 * 1000; // 5 minutes

    // Find items accessed shortly after the given item
    const itemAccesses = this.accessHistory.filter(access => access.itemId === itemId);

    itemAccesses.forEach(access => {
      const nextAccesses = this.accessHistory.filter(next =>
        next.itemId !== itemId &&
        next.timestamp > access.timestamp &&
        next.timestamp - access.timestamp <= maxGap
      );

      nextAccesses.forEach(nextAccess => {
        const count = sequential.get(nextAccess.itemId) || 0;
        sequential.set(nextAccess.itemId, count + 1);
      });
    });

    const totalSequences = itemAccesses.length;
    return Array.from(sequential.entries())
      .map(([itemId, count]) => ({
        itemId,
        confidence: Math.min(0.8, count / totalSequences)
      }))
      .filter(item => item.confidence > 0.4)
      .slice(0, 3);
  }

  /**
   * Prefetch an item into cache
   */
  private async prefetchItem(itemId: string): Promise<void> {
    try {
      // This would integrate with your data fetching service
      console.log(`Prefetching item: ${itemId}`);

      // Simulate prefetch delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Add to cache entries with lower priority
      const estimatedSize = 2048; // Base estimated size
      const compressionRatio = this.compressionEnabled ? 0.7 : 1.0; // Default compression for prefetched items

      const entry: CacheEntry = {
        id: itemId,
        type: 'recipe', // Would be determined from actual data
        size: Math.round(estimatedSize * compressionRatio),
        lastAccessed: Date.now(),
        accessCount: 0,
        priority: 0.3, // Lower priority for prefetched items
        dependencies: [],
        tags: [],
        isStale: false,
        compressionRatio
      };

      this.cacheEntries.set(itemId, entry);
    } catch (error) {
      console.error(`Failed to prefetch item ${itemId}:`, error);
    }
  }

  /**
   * Start periodic cache optimization
   */
  private startPeriodicOptimization(): void {
    setInterval(() => {
      this.optimizeCache();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Optimize cache based on current strategy
   */
  async optimizeCache(): Promise<void> {
    const stats = await this.getCacheStats();

    // Check if optimization is needed
    if (stats.totalSize < this.maxCacheSize * 0.8 && stats.totalItems < this.maxEntries * 0.8) {
      return; // Cache is not full enough to require optimization
    }

    console.log('Starting cache optimization...');

    switch (this.strategy) {
      case 'intelligent':
        await this.intelligentOptimization();
        break;
      case 'lru':
        await this.lruOptimization();
        break;
      case 'lfu':
        await this.lfuOptimization();
        break;
      case 'priority':
        await this.priorityOptimization();
        break;
      case 'size-based':
        await this.sizeBasedOptimization();
        break;
    }

    console.log('Cache optimization completed');
  }

  /**
   * Intelligent optimization combining multiple strategies
   */
  private async intelligentOptimization(): Promise<void> {
    const entries = Array.from(this.cacheEntries.values());

    // Calculate composite score for each entry
    const scoredEntries = entries.map(entry => ({
      entry,
      score: this.calculateCompositeScore(entry)
    }));

    // Sort by score (lower scores are evicted first)
    scoredEntries.sort((a, b) => a.score - b.score);

    // Remove lowest scoring entries until under limits
    const stats = await this.getCacheStats();
    let currentSize = stats.totalSize;
    let currentCount = stats.totalItems;

    for (const { entry } of scoredEntries) {
      if (currentSize <= this.maxCacheSize * 0.7 && currentCount <= this.maxEntries * 0.7) {
        break;
      }

      await this.evictEntry(entry.id);
      currentSize -= entry.size;
      currentCount--;
    }
  }

  /**
   * Calculate composite score for intelligent optimization
   */
  private calculateCompositeScore(entry: CacheEntry): number {
    const now = Date.now();
    const daysSinceAccess = (now - entry.lastAccessed) / (1000 * 60 * 60 * 24);

    let score = 0;

    // Priority component (40% weight)
    score += entry.priority * 0.4;

    // Recency component (25% weight)
    const recencyScore = Math.max(0, 1 - daysSinceAccess / 30); // Decay over 30 days
    score += recencyScore * 0.25;

    // Frequency component (20% weight)
    const frequencyScore = Math.min(1, entry.accessCount / 100); // Normalize to 100 accesses
    score += frequencyScore * 0.2;

    // Size efficiency component (10% weight)
    const sizeScore = 1 - Math.min(1, entry.size / (100 * 1024)); // Prefer smaller items
    score += sizeScore * 0.1;

    // Dependency component (5% weight)
    const dependencyScore = Math.min(1, this.getDependentCount(entry.id) / 10);
    score += dependencyScore * 0.05;

    return score;
  }

  /**
   * LRU (Least Recently Used) optimization
   */
  private async lruOptimization(): Promise<void> {
    const entries = Array.from(this.cacheEntries.values())
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    const stats = await this.getCacheStats();
    let currentSize = stats.totalSize;
    let currentCount = stats.totalItems;

    for (const entry of entries) {
      if (currentSize <= this.maxCacheSize * 0.8 && currentCount <= this.maxEntries * 0.8) {
        break;
      }

      await this.evictEntry(entry.id);
      currentSize -= entry.size;
      currentCount--;
    }
  }

  /**
   * LFU (Least Frequently Used) optimization
   */
  private async lfuOptimization(): Promise<void> {
    const entries = Array.from(this.cacheEntries.values())
      .sort((a, b) => a.accessCount - b.accessCount);

    const stats = await this.getCacheStats();
    let currentSize = stats.totalSize;
    let currentCount = stats.totalItems;

    for (const entry of entries) {
      if (currentSize <= this.maxCacheSize * 0.8 && currentCount <= this.maxEntries * 0.8) {
        break;
      }

      await this.evictEntry(entry.id);
      currentSize -= entry.size;
      currentCount--;
    }
  }

  /**
   * Priority-based optimization
   */
  private async priorityOptimization(): Promise<void> {
    const entries = Array.from(this.cacheEntries.values())
      .sort((a, b) => a.priority - b.priority);

    const stats = await this.getCacheStats();
    let currentSize = stats.totalSize;
    let currentCount = stats.totalItems;

    for (const entry of entries) {
      if (currentSize <= this.maxCacheSize * 0.8 && currentCount <= this.maxEntries * 0.8) {
        break;
      }

      await this.evictEntry(entry.id);
      currentSize -= entry.size;
      currentCount--;
    }
  }

  /**
   * Size-based optimization (remove largest items first)
   */
  private async sizeBasedOptimization(): Promise<void> {
    const entries = Array.from(this.cacheEntries.values())
      .sort((a, b) => b.size - a.size);

    const stats = await this.getCacheStats();
    let currentSize = stats.totalSize;

    for (const entry of entries) {
      if (currentSize <= this.maxCacheSize * 0.8) {
        break;
      }

      await this.evictEntry(entry.id);
      currentSize -= entry.size;
    }
  }

  /**
   * Evict an entry from cache
   */
  private async evictEntry(itemId: string): Promise<void> {
    try {
      const entry = this.cacheEntries.get(itemId);
      if (!entry) return;

      // Remove from storage based on type
      switch (entry.type) {
        case 'recipe':
          await offlineStorage.deleteRecipe(itemId);
          break;
        case 'ingredient':
          await offlineStorage.deleteIngredient(itemId);
          break;
        case 'technique':
          await offlineStorage.deleteTechnique(itemId);
          break;
        case 'menu':
          await offlineStorage.deleteMenu(itemId);
          break;
      }

      // Remove from cache entries
      this.cacheEntries.delete(itemId);

      console.log(`Evicted ${entry.type} ${itemId} (${entry.size} bytes)`);
    } catch (error) {
      console.error(`Failed to evict entry ${itemId}:`, error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getCacheStats(): Promise<OfflineStorageStats & { health: CacheHealth; compressionStats?: { enabled: boolean; averageRatio: number; spaceSaved: number } }> {
    const baseStats = await offlineStorage.getStorageStats();
    const health = this.calculateCacheHealth();

    // Calculate compression statistics if enabled
    const compressionStats = this.compressionEnabled ? this.calculateCompressionStats() : undefined;

    return {
      ...baseStats,
      health,
      compressionStats
    };
  }

  /**
   * Calculate compression statistics
   */
  private calculateCompressionStats(): { enabled: boolean; averageRatio: number; spaceSaved: number } {
    const entries = Array.from(this.cacheEntries.values());
    const entriesWithCompression = entries.filter(entry => entry.compressionRatio && entry.compressionRatio < 1.0);

    if (entriesWithCompression.length === 0) {
      return { enabled: true, averageRatio: 1.0, spaceSaved: 0 };
    }

    const totalCompressionRatio = entriesWithCompression.reduce((sum, entry) => sum + (entry.compressionRatio || 1.0), 0);
    const averageRatio = totalCompressionRatio / entriesWithCompression.length;

    // Calculate space saved (in bytes)
    const spaceSaved = entriesWithCompression.reduce((saved, entry) => {
      const originalSize = entry.size / (entry.compressionRatio || 1.0);
      return saved + (originalSize - entry.size);
    }, 0);

    return {
      enabled: true,
      averageRatio,
      spaceSaved: Math.round(spaceSaved)
    };
  }

  /**
   * Calculate cache health metrics
   */
  private calculateCacheHealth(): CacheHealth {
    const entries = Array.from(this.cacheEntries.values());
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const staleEntries = entries.filter(entry => entry.isStale).length;

    return {
      hitRate: 0.85, // Would be calculated from actual hit/miss data
      missRate: 0.15,
      stalenessRate: staleEntries / entries.length,
      fragmentationRate: 0.1, // Would be calculated from storage fragmentation
      utilizationRate: entries.length / this.maxEntries,
      averageAccessTime: totalAccesses > 0 ? 50 : 0 // ms, would be measured from actual access times
    };
  }

  /**
   * Helper methods for cache entry creation
   */
  private getItemType(item: any): CacheEntry['type'] {
    if (item.ingredients) return 'recipe';
    if (item.category && item.price !== undefined) return 'ingredient';
    if (item.steps) return 'technique';
    if (item.items) return 'menu';
    return 'recipe';
  }

  private estimateItemSize(item: any): number {
    const jsonString = JSON.stringify(item);
    const baseSize = jsonString.length * 2; // Rough estimate in bytes

    // Apply compression ratio if compression is enabled
    if (this.compressionEnabled) {
      // Simulate compression ratio based on content type and size
      const compressionRatio = this.calculateCompressionRatio(jsonString);
      return Math.round(baseSize * compressionRatio);
    }

    return baseSize;
  }

  /**
   * Calculate compression ratio for content
   */
  private calculateCompressionRatio(content: string): number {
    // Simulate realistic compression ratios based on content characteristics
    const size = content.length;

    // Larger content typically compresses better
    let ratio = 0.7; // Base 30% compression

    // Better compression for larger files
    if (size > 10000) ratio = 0.6; // 40% compression
    else if (size > 5000) ratio = 0.65; // 35% compression
    else if (size < 1000) ratio = 0.85; // Only 15% compression for small files

    // JSON with repetitive structure compresses well
    const repetitivePatterns = (content.match(/[{}\[\]",]/g) || []).length;
    const repetitiveRatio = repetitivePatterns / size;
    if (repetitiveRatio > 0.3) {
      ratio -= 0.1; // Additional 10% compression for repetitive content
    }

    return Math.max(0.4, Math.min(1.0, ratio)); // Clamp between 40% and 100%
  }

  private extractDependencies(item: any): string[] {
    if (item.ingredients) {
      return item.ingredients.map((ing: any) => ing.name.toLowerCase());
    }
    return [];
  }

  private extractTags(item: any): string[] {
    return item.tags || item.flavorProfile || [];
  }

  private isItemStale(item: any): boolean {
    if (!item.lastSyncedAt) return true;
    const daysSinceSync = (Date.now() - item.lastSyncedAt) / (1000 * 60 * 60 * 24);
    return daysSinceSync > 7; // Consider stale after 7 days
  }

  /**
   * Public API methods
   */

  setCacheStrategy(strategy: CacheStrategy): void {
    this.strategy = strategy;
  }

  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
  }

  setMaxEntries(count: number): void {
    this.maxEntries = count;
  }

  enableCompression(enabled: boolean): void {
    this.compressionEnabled = enabled;
  }

  enablePredictive(enabled: boolean): void {
    this.predictiveEnabled = enabled;
  }

  async forceOptimization(): Promise<void> {
    await this.optimizeCache();
  }

  async clearCache(): Promise<void> {
    await offlineStorage.clearAllData();
    this.cacheEntries.clear();
    this.accessHistory = [];
  }

  getAccessHistory(): Array<{ itemId: string; timestamp: number }> {
    return [...this.accessHistory];
  }

  getCacheEntries(): Map<string, CacheEntry> {
    return new Map(this.cacheEntries);
  }
}

// Export singleton instance
export const intelligentCacheService = new IntelligentCacheService();
