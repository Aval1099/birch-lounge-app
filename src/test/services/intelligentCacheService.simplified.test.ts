// =============================================================================
// INTELLIGENT CACHE SERVICE TESTS - SIMPLIFIED VERSION
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OfflineStorageStats } from '../../types/offline';
import type { Recipe, Ingredient } from '../../types';

// Create a fresh mock for each test run
const createMockStorage = () => ({
  getCachedRecipes: vi.fn().mockResolvedValue([]),
  getCachedIngredients: vi.fn().mockResolvedValue([]),
  getCachedTechniques: vi.fn().mockResolvedValue([]),
  getCachedMenus: vi.fn().mockResolvedValue([]),
  getCachedRecipe: vi.fn().mockResolvedValue(null),
  deleteRecipe: vi.fn().mockResolvedValue(true),
  deleteIngredient: vi.fn().mockResolvedValue(true),
  deleteTechnique: vi.fn().mockResolvedValue(true),
  deleteMenu: vi.fn().mockResolvedValue(true),
  getStorageStats: vi.fn().mockResolvedValue({
    totalSize: 0,
    itemCount: 0,
    lastUpdated: Date.now()
  }),
  clearAllData: vi.fn().mockResolvedValue(true),
});

// Mock the offline storage service
vi.mock('../../services/offlineStorageService', () => {
  const mockStorage = createMockStorage();
  return {
    offlineStorage: mockStorage
  };
});

// Mock console to avoid noise
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('IntelligentCacheService - Core Functionality', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let intelligentCacheService: any;

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
    // Get fresh reference to mocked storage
    const { offlineStorage } = await import('../../services/offlineStorageService');
    mockStorage = offlineStorage as any;

    // Setup mock data
    mockStorage.getCachedRecipes.mockResolvedValue([mockRecipe]);
    mockStorage.getCachedIngredients.mockResolvedValue([mockIngredient]);
    mockStorage.getStorageStats.mockResolvedValue(mockStorageStats);

    // Import service fresh
    const module = await import('../../services/intelligentCacheService');
    intelligentCacheService = module.intelligentCacheService;

    // Clear and reload with mock data
    await intelligentCacheService.clearCache();
    await (intelligentCacheService as any).loadCacheMetadata();
  });

  describe('Basic Functionality', () => {
    it('should be defined and have core methods', () => {
      expect(intelligentCacheService).toBeDefined();
      expect(typeof intelligentCacheService.getCacheEntries).toBe('function');
      expect(typeof intelligentCacheService.getCacheStats).toBe('function');
      expect(typeof intelligentCacheService.enableCompression).toBe('function');
    });

    it('should create cache entries from mock data', () => {
      const entries = intelligentCacheService.getCacheEntries();
      expect(entries.size).toBeGreaterThan(0);

      const recipeEntry = entries.get('recipe-1');
      expect(recipeEntry).toBeDefined();
      expect(recipeEntry?.type).toBe('recipe');
      expect(recipeEntry?.id).toBe('recipe-1');
    });

    it('should calculate priorities for cache entries', () => {
      const entries = intelligentCacheService.getCacheEntries();
      const recipeEntry = entries.get('recipe-1');

      expect(recipeEntry?.priority).toBeDefined();
      expect(recipeEntry?.priority).toBeGreaterThan(0);
      expect(recipeEntry?.priority).toBeLessThanOrEqual(1);
    });
  });

  describe('Compression', () => {
    it('should handle compression settings', () => {
      expect(() => intelligentCacheService.enableCompression(true)).not.toThrow();
      expect(() => intelligentCacheService.enableCompression(false)).not.toThrow();
    });

    it('should calculate compression ratios', () => {
      const service = intelligentCacheService as any;
      const smallContent = JSON.stringify({ id: '1', name: 'small' });
      const largeContent = JSON.stringify({
        id: '1',
        name: 'large',
        data: Array(1000).fill('repetitive data'),
      });

      const smallRatio = service.calculateCompressionRatio(smallContent);
      const largeRatio = service.calculateCompressionRatio(largeContent);

      expect(smallRatio).toBeGreaterThan(0);
      expect(largeRatio).toBeGreaterThan(0);
      expect(smallRatio).toBeLessThanOrEqual(1);
      expect(largeRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      const stats = await intelligentCacheService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.health).toBeDefined();
      expect(typeof stats.health.hitRate).toBe('number');
      expect(typeof stats.health.missRate).toBe('number');
    });

    it('should support different optimization strategies', () => {
      const strategies = ['lru', 'lfu', 'priority', 'size-based', 'intelligent'] as const;

      strategies.forEach(strategy => {
        expect(() => intelligentCacheService.setCacheStrategy(strategy)).not.toThrow();
      });
    });

    it('should allow cache clearing', async () => {
      await intelligentCacheService.clearCache();
      expect(mockStorage.clearAllData).toHaveBeenCalled();
    });
  });

  describe('Access Tracking', () => {
    it('should track access history', () => {
      // Manually trigger access recording
      (intelligentCacheService as any).recordAccess('recipe-1');

      const history = intelligentCacheService.getAccessHistory();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);

      const lastAccess = history[history.length - 1];
      expect(lastAccess.itemId).toBe('recipe-1');
      expect(typeof lastAccess.timestamp).toBe('number');
    });

    it('should update cache entry on access', () => {
      const entriesBefore = intelligentCacheService.getCacheEntries();
      const entryBefore = entriesBefore.get('recipe-1');
      const initialAccessCount = entryBefore?.accessCount || 0;

      // Manually trigger access recording
      (intelligentCacheService as any).recordAccess('recipe-1');

      const entriesAfter = intelligentCacheService.getCacheEntries();
      const entryAfter = entriesAfter.get('recipe-1');

      expect(entryAfter?.accessCount).toBe(initialAccessCount + 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      mockStorage.getStorageStats.mockRejectedValue(new Error('Storage error'));

      await expect(intelligentCacheService.getCacheStats()).rejects.toThrow('Storage error');
    });

    it('should handle configuration changes', () => {
      expect(() => {
        intelligentCacheService.setMaxCacheSize(200 * 1024 * 1024);
        intelligentCacheService.setMaxEntries(20000);
        intelligentCacheService.enablePredictive(false);
      }).not.toThrow();
    });
  });
});
