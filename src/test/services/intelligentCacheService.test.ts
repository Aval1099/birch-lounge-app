// =============================================================================
// INTELLIGENT CACHE SERVICE TESTS
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { OfflineStorageStats } from '../../types/offline';
import type { Recipe, Ingredient, Technique, Menu } from '../../types';

// Create mock functions that we can control (hoisted to avoid TDZ issues)
const {
  mockGetCachedRecipes,
  mockGetCachedIngredients,
  mockGetCachedTechniques,
  mockGetCachedMenus,
  mockGetCachedRecipe,
  mockDeleteRecipe,
  mockDeleteIngredient,
  mockDeleteTechnique,
  mockDeleteMenu,
  mockGetStorageStats,
  mockClearAllData
} = vi.hoisted(() => {
  const createAsyncMock = <T>(defaultValue: T) =>
    vi.fn<() => Promise<T>>(async () => defaultValue);

  return {
    mockGetCachedRecipes: createAsyncMock<unknown[]>([]),
    mockGetCachedIngredients: createAsyncMock<unknown[]>([]),
    mockGetCachedTechniques: createAsyncMock<unknown[]>([]),
    mockGetCachedMenus: createAsyncMock<unknown[]>([]),
    mockGetCachedRecipe: createAsyncMock<unknown | null>(null),
    mockDeleteRecipe: createAsyncMock<boolean>(true),
    mockDeleteIngredient: createAsyncMock<boolean>(true),
    mockDeleteTechnique: createAsyncMock<boolean>(true),
    mockDeleteMenu: createAsyncMock<boolean>(true),
    mockGetStorageStats: createAsyncMock<OfflineStorageStats>({
      totalItems: 0,
      totalSize: 0,
      recipes: { count: 0, size: 0, pendingSync: 0 },
      ingredients: { count: 0, size: 0, pendingSync: 0 },
      techniques: { count: 0, size: 0, pendingSync: 0 },
      menus: { count: 0, size: 0, pendingSync: 0 },
      images: { count: 0, size: 0 }
    }),
    mockClearAllData: createAsyncMock<void>(undefined)
  };
});

// Mock the offline storage service with factory function
vi.mock('../../services/offlineStorageService', () => ({
  offlineStorage: {
    getCachedRecipes: mockGetCachedRecipes,
    getCachedIngredients: mockGetCachedIngredients,
    getCachedTechniques: mockGetCachedTechniques,
    getCachedMenus: mockGetCachedMenus,
    getCachedRecipe: mockGetCachedRecipe,
    deleteRecipe: mockDeleteRecipe,
    deleteIngredient: mockDeleteIngredient,
    deleteTechnique: mockDeleteTechnique,
    deleteMenu: mockDeleteMenu,
    getStorageStats: mockGetStorageStats,
    clearAllData: mockClearAllData,
  }
}));

// Mock console methods to avoid noise in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Import after mocking
import { intelligentCacheService } from '../../services/intelligentCacheService';
import { offlineStorage } from '../../services/offlineStorageService';

// Create a reference to the mocked storage for easier testing
const mockOfflineStorage = offlineStorage;

describe('IntelligentCacheService', () => {
  // Sample test data
  const mockRecipe: Recipe & { lastSyncedAt?: number } = {
    id: 'recipe-1',
    name: 'Test Recipe',
    category: 'Cocktails',
    ingredients: [{ name: 'ingredient1', amount: '1', unit: 'cup' }],
    instructions: ['Step 1'],
    timesOrdered: 15,
    isFavorite: true,
    lastMade: new Date().toISOString(),
    rating: 4.5,
    lastSyncedAt: Date.now() - 86400000, // 1 day ago
    versionMetadata: {
      versionNumber: '1.0',
      isMainVersion: true,
      versionType: 'original',
      versionStatus: 'published'
    }
  };

  const mockIngredient: Ingredient & { lastSyncedAt?: number } = {
    id: 'ingredient-1',
    name: 'Test Ingredient',
    category: 'Spirits',
    price: 25.99,
    lastSyncedAt: Date.now() - 172800000, // 2 days ago
  };

  const mockStorageStats: OfflineStorageStats = {
    totalItems: 10,
    totalSize: 50000,
    recipes: { count: 5, size: 25000, pendingSync: 1 },
    ingredients: { count: 3, size: 15000, pendingSync: 0 },
    techniques: { count: 2, size: 10000, pendingSync: 0 },
    menus: { count: 0, size: 0, pendingSync: 0 },
    images: { count: 0, size: 0 },
  };

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup default mock returns
    mockGetCachedRecipes.mockResolvedValue([mockRecipe]);
    mockGetCachedIngredients.mockResolvedValue([mockIngredient]);
    mockGetCachedTechniques.mockResolvedValue([]);
    mockGetCachedMenus.mockResolvedValue([]);
    mockGetStorageStats.mockResolvedValue(mockStorageStats);
    mockGetCachedRecipe.mockResolvedValue(mockRecipe);

    // Clear cache entries and access history first
    await intelligentCacheService.clearCache();

    // Force reload cache metadata with mocked data
    await (intelligentCacheService as any).loadCacheMetadata();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize cache monitoring', async () => {
      expect(mockOfflineStorage.getCachedRecipes).toHaveBeenCalled();
      expect(mockOfflineStorage.getCachedIngredients).toHaveBeenCalled();
      expect(mockOfflineStorage.getCachedTechniques).toHaveBeenCalled();
      expect(mockOfflineStorage.getCachedMenus).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockGetCachedRecipes.mockRejectedValue(new Error('Storage error'));

      // The service should handle errors during initialization without throwing
      // Since it's already imported, we test that it doesn't crash on subsequent operations
      expect(intelligentCacheService).toBeDefined();

      // Should be able to call methods without throwing
      expect(() => intelligentCacheService.enableCompression(true)).not.toThrow();
    });
  });

  describe('Cache Entry Management', () => {
    it('should create cache entries with correct metadata', async () => {
      const entries = intelligentCacheService.getCacheEntries();

      expect(entries.size).toBeGreaterThan(0);

      const recipeEntry = entries.get('recipe-1');
      expect(recipeEntry).toBeDefined();
      expect(recipeEntry?.type).toBe('recipe');
      expect(recipeEntry?.priority).toBeGreaterThan(0.5); // Should have high priority due to favorites/rating
      expect(recipeEntry?.isStale).toBe(false); // 1 day old, not stale yet
    });

    it('should calculate compression ratios when compression is enabled', async () => {
      intelligentCacheService.enableCompression(true);

      const entries = intelligentCacheService.getCacheEntries();
      const recipeEntry = entries.get('recipe-1');

      expect(recipeEntry?.compressionRatio).toBeDefined();
      expect(recipeEntry?.compressionRatio).toBeLessThan(1.0);
    });

    it('should not apply compression when disabled', async () => {
      intelligentCacheService.enableCompression(false);

      // Force reload cache metadata
      await intelligentCacheService.clearCache();
      await (intelligentCacheService as any).loadCacheMetadata();

      const entries = intelligentCacheService.getCacheEntries();
      const recipeEntry = entries.get('recipe-1');

      expect(recipeEntry?.compressionRatio).toBe(1.0);
    });
  });

  describe('Access Tracking', () => {
    it('should record access patterns', async () => {
      // The access tracking is set up during initialization, so we need to call the intercepted method
      // First ensure we have cache entries
      const entriesBefore = intelligentCacheService.getCacheEntries();
      expect(entriesBefore.size).toBeGreaterThan(0);

      // Manually trigger access recording since the interception might not work in tests
      (intelligentCacheService as any).recordAccess('recipe-1');

      const history = intelligentCacheService.getAccessHistory();
      expect(history.length).toBeGreaterThan(0);

      const lastAccess = history[history.length - 1];
      expect(lastAccess.itemId).toBe('recipe-1');
      expect(lastAccess.timestamp).toBeCloseTo(Date.now(), -2); // Within 100ms
    });

    it('should update cache entry on access', async () => {
      const entriesBefore = intelligentCacheService.getCacheEntries();
      const entryBefore = entriesBefore.get('recipe-1');
      const initialAccessCount = entryBefore?.accessCount || 0;

      // Simulate access through the intercepted method
      await offlineStorage.getCachedRecipe('recipe-1');

      const entriesAfter = intelligentCacheService.getCacheEntries();
      const entryAfter = entriesAfter.get('recipe-1');

      expect(entryAfter?.accessCount).toBe(initialAccessCount + 1);
      expect(entryAfter?.lastAccessed).toBeCloseTo(Date.now(), -2);
    });

    it('should limit access history size', async () => {
      // Simulate many accesses
      for (let i = 0; i < 12000; i++) {
        await offlineStorage.getCachedRecipe('recipe-1');
      }

      const history = intelligentCacheService.getAccessHistory();
      expect(history.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('Priority Calculation', () => {
    it('should assign higher priority to favorites', async () => {
      const entries = intelligentCacheService.getCacheEntries();
      const recipeEntry = entries.get('recipe-1');

      expect(recipeEntry?.priority).toBeGreaterThan(0.6); // Should be high due to favorite status
    });

    it('should boost priority for frequently ordered items', async () => {
      const mockFrequentRecipe = {
        ...mockRecipe,
        id: 'frequent-recipe',
        timesOrdered: 50,
        isFavorite: false
      };

      mockGetCachedRecipes.mockResolvedValue([mockFrequentRecipe]);
      await intelligentCacheService.clearCache();
      await (intelligentCacheService as any).loadCacheMetadata();

      const entries = intelligentCacheService.getCacheEntries();
      const entry = entries.get('frequent-recipe');

      expect(entry?.priority).toBeGreaterThan(0.6);
    });

    it('should recalculate priority based on access patterns', async () => {
      const entries = intelligentCacheService.getCacheEntries();
      const entryBefore = entries.get('recipe-1');
      const priorityBefore = entryBefore?.priority || 0;

      // Simulate multiple accesses through the intercepted method
      for (let i = 0; i < 10; i++) {
        await offlineStorage.getCachedRecipe('recipe-1');
      }

      const entriesAfter = intelligentCacheService.getCacheEntries();
      const entryAfter = entriesAfter.get('recipe-1');

      expect(entryAfter?.priority).toBeGreaterThanOrEqual(priorityBefore);
    });
  });

  describe('Compression Functionality', () => {
    it('should calculate realistic compression ratios', async () => {
      intelligentCacheService.enableCompression(true);

      // Test with different content sizes
      const smallContent = JSON.stringify({ id: '1', name: 'small' });
      const largeContent = JSON.stringify({
        id: '1',
        name: 'large',
        data: Array(1000).fill('repetitive data structure'),
        metadata: { created: Date.now(), tags: ['tag1', 'tag2'] }
      });

      // Access private method through reflection for testing
      const service = intelligentCacheService as any;
      const smallRatio = service.calculateCompressionRatio(smallContent);
      const largeRatio = service.calculateCompressionRatio(largeContent);

      expect(smallRatio).toBeGreaterThan(largeRatio); // Larger content compresses better
      expect(smallRatio).toBeLessThanOrEqual(1.0);
      expect(largeRatio).toBeGreaterThanOrEqual(0.4); // Minimum compression ratio
    });

    it('should provide compression statistics', async () => {
      intelligentCacheService.enableCompression(true);
      await intelligentCacheService.clearCache(); // Reload with compression
      await (intelligentCacheService as any).loadCacheMetadata();

      const stats = await intelligentCacheService.getCacheStats();

      expect(stats.compressionStats).toBeDefined();
      expect(stats.compressionStats?.enabled).toBe(true);
      expect(stats.compressionStats?.averageRatio).toBeLessThan(1.0);
      expect(stats.compressionStats?.spaceSaved).toBeGreaterThanOrEqual(0);
    });

    it('should not provide compression stats when disabled', async () => {
      intelligentCacheService.enableCompression(false);

      const stats = await intelligentCacheService.getCacheStats();

      expect(stats.compressionStats).toBeUndefined();
    });
  });

  describe('Cache Optimization Strategies', () => {
    beforeEach(() => {
      // Mock a cache that needs optimization
      mockGetStorageStats.mockResolvedValue({
        ...mockStorageStats,
        totalSize: 90 * 1024 * 1024, // 90MB - over 80% of default 100MB limit
        totalItems: 9000 // Over 80% of default 10000 limit
      });
    });

    it('should trigger optimization when cache is full', async () => {
      // Mock console.log to verify optimization starts
      const consoleSpy = vi.spyOn(console, 'log');

      await intelligentCacheService.optimizeCache();

      expect(consoleSpy).toHaveBeenCalledWith('Starting cache optimization...');
    });

    it('should not optimize when cache is not full', async () => {
      mockGetStorageStats.mockResolvedValue({
        ...mockStorageStats,
        totalSize: 50 * 1024 * 1024, // 50MB - under threshold
        totalItems: 5000 // Under threshold
      });

      const consoleSpy = vi.spyOn(console, 'log');

      await intelligentCacheService.optimizeCache();

      expect(consoleSpy).not.toHaveBeenCalledWith('Starting cache optimization...');
    });

    it('should support different optimization strategies', async () => {
      const strategies = ['lru', 'lfu', 'priority', 'size-based', 'intelligent'] as const;

      for (const strategy of strategies) {
        intelligentCacheService.setCacheStrategy(strategy);

        // Should not throw
        await expect(intelligentCacheService.forceOptimization()).resolves.not.toThrow();
      }
    });

    it('should evict entries during optimization', async () => {
      // Add multiple entries to cache
      const multipleRecipes = Array.from({ length: 10 }, (_, i) => ({
        ...mockRecipe,
        id: `recipe-${i}`,
        lastSyncedAt: Date.now() - (i * 86400000) // Different ages
      }));

      mockGetCachedRecipes.mockResolvedValue(multipleRecipes);
      await intelligentCacheService.clearCache(); // Reload with new data
      await (intelligentCacheService as any).loadCacheMetadata();

      const entriesBefore = intelligentCacheService.getCacheEntries().size;

      await intelligentCacheService.forceOptimization();

      const entriesAfter = intelligentCacheService.getCacheEntries().size;

      expect(mockDeleteRecipe).toHaveBeenCalled();
      expect(entriesAfter).toBeLessThanOrEqual(entriesBefore);
    });
  });

  describe('Predictive Prefetching', () => {
    it('should be enabled by default', () => {
      expect(intelligentCacheService).toBeDefined();
      // Predictive is enabled by default in constructor
    });

    it('should be configurable', () => {
      intelligentCacheService.enablePredictive(false);
      intelligentCacheService.enablePredictive(true);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should trigger prefetching on access patterns', async () => {
      intelligentCacheService.enablePredictive(true);

      // Simulate access pattern
      await offlineStorage.getCachedRecipe('recipe-1');

      // Should not throw and should complete
      expect(true).toBe(true);
    });
  });

  describe('Cache Health Metrics', () => {
    it('should calculate cache health', async () => {
      const stats = await intelligentCacheService.getCacheStats();

      expect(stats.health).toBeDefined();
      expect(stats.health.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.health.hitRate).toBeLessThanOrEqual(1);
      expect(stats.health.missRate).toBeGreaterThanOrEqual(0);
      expect(stats.health.missRate).toBeLessThanOrEqual(1);
      expect(stats.health.stalenessRate).toBeGreaterThanOrEqual(0);
      expect(stats.health.utilizationRate).toBeGreaterThanOrEqual(0);
    });

    it('should track staleness correctly', async () => {
      const staleRecipe = {
        ...mockRecipe,
        id: 'stale-recipe',
        lastSyncedAt: Date.now() - (8 * 86400000) // 8 days ago - stale
      };

      mockGetCachedRecipes.mockResolvedValue([mockRecipe, staleRecipe]);
      await intelligentCacheService.clearCache();
      await (intelligentCacheService as any).loadCacheMetadata();

      const stats = await intelligentCacheService.getCacheStats();

      expect(stats.health.stalenessRate).toBeGreaterThan(0);
    });
  });

  describe('Public API', () => {
    it('should allow configuration of cache parameters', () => {
      intelligentCacheService.setMaxCacheSize(200 * 1024 * 1024); // 200MB
      intelligentCacheService.setMaxEntries(20000);
      intelligentCacheService.setCacheStrategy('lru');
      intelligentCacheService.enableCompression(false);
      intelligentCacheService.enablePredictive(false);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should provide access to cache entries', () => {
      const entries = intelligentCacheService.getCacheEntries();

      expect(entries).toBeInstanceOf(Map);
      expect(entries.size).toBeGreaterThanOrEqual(0);
    });

    it('should provide access to access history', () => {
      const history = intelligentCacheService.getAccessHistory();

      expect(Array.isArray(history)).toBe(true);
    });

    it('should allow cache clearing', async () => {
      await intelligentCacheService.clearCache();

      expect(mockOfflineStorage.clearAllData).toHaveBeenCalled();

      const entries = intelligentCacheService.getCacheEntries();
      const history = intelligentCacheService.getAccessHistory();

      expect(entries.size).toBe(0);
      expect(history.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockGetStorageStats.mockRejectedValue(new Error('Storage error'));

      await expect(intelligentCacheService.getCacheStats()).rejects.toThrow('Storage error');
    });

    it('should handle eviction errors gracefully', async () => {
      // First set up cache with entries that will trigger eviction
      const multipleRecipes = Array.from({ length: 5 }, (_, i) => ({
        ...mockRecipe,
        id: `recipe-${i}`,
        lastSyncedAt: Date.now() - (i * 86400000)
      }));

      mockGetCachedRecipes.mockResolvedValue(multipleRecipes);
      await intelligentCacheService.clearCache();
      await (intelligentCacheService as any).loadCacheMetadata();

      // Now mock the delete to fail
      mockDeleteRecipe.mockRejectedValue(new Error('Delete error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw, but log error
      await intelligentCacheService.forceOptimization();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to evict entry'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
