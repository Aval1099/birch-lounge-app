// =============================================================================
// OFFLINE STORAGE SERVICE - IndexedDB Implementation
// =============================================================================

import type {
  OfflineRecipe,
  OfflineIngredient,
  OfflineTechnique,
  OfflineMenu,
  SyncQueueItem,
  OfflineStorageStats,
  SyncStatus,
  SyncOperation
} from '../types/offline';
import type { Recipe, Ingredient, Technique, Menu } from '../types';

/**
 * IndexedDB database configuration
 */
const DB_NAME = 'BirchLoungeOfflineDB';
const DB_VERSION = 1;

/**
 * Object store names
 */
const STORES = {
  RECIPES: 'recipes',
  INGREDIENTS: 'ingredients',
  TECHNIQUES: 'techniques',
  MENUS: 'menus',
  SYNC_QUEUE: 'syncQueue',
  IMAGES: 'images',
  METADATA: 'metadata'
} as const;

/**
 * Offline Storage Service
 * Manages local IndexedDB storage for offline functionality
 */
class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Check if we're in a test environment or IndexedDB is not available
      if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
        // In test environment or unsupported browser, use fallback
        console.warn('IndexedDB not available, using fallback storage');
        this.db = null; // Will trigger fallback behavior
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create recipes store
        if (!db.objectStoreNames.contains(STORES.RECIPES)) {
          const recipesStore = db.createObjectStore(STORES.RECIPES, { keyPath: 'id' });
          recipesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          recipesStore.createIndex('lastSyncedAt', 'lastSyncedAt', { unique: false });
          recipesStore.createIndex('category', 'category', { unique: false });
        }

        // Create ingredients store
        if (!db.objectStoreNames.contains(STORES.INGREDIENTS)) {
          const ingredientsStore = db.createObjectStore(STORES.INGREDIENTS, { keyPath: 'id' });
          ingredientsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          ingredientsStore.createIndex('category', 'category', { unique: false });
        }

        // Create techniques store
        if (!db.objectStoreNames.contains(STORES.TECHNIQUES)) {
          const techniquesStore = db.createObjectStore(STORES.TECHNIQUES, { keyPath: 'id' });
          techniquesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          techniquesStore.createIndex('category', 'category', { unique: false });
        }

        // Create menus store
        if (!db.objectStoreNames.contains(STORES.MENUS)) {
          const menusStore = db.createObjectStore(STORES.MENUS, { keyPath: 'id' });
          menusStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          menusStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('type', 'type', { unique: false });
        }

        // Create images store
        if (!db.objectStoreNames.contains(STORES.IMAGES)) {
          const imagesStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
          imagesStore.createIndex('size', 'size', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db && typeof window !== 'undefined' && window.indexedDB) {
      await this.initialize();
    }
  }

  /**
   * Check if IndexedDB is available and initialized
   */
  private isIndexedDBAvailable(): boolean {
    return this.db !== null && typeof window !== 'undefined' && window.indexedDB;
  }

  /**
   * Fallback storage using localStorage (for testing/unsupported environments)
   */
  private fallbackStorage = {
    get: (key: string) => {
      try {
        const data = localStorage.getItem(`birch-offline-${key}`);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
    set: (key: string, value: any) => {
      try {
        localStorage.setItem(`birch-offline-${key}`, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove: (key: string) => {
      try {
        localStorage.removeItem(`birch-offline-${key}`);
        return true;
      } catch {
        return false;
      }
    },
    clear: () => {
      try {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('birch-offline-'));
        keys.forEach(key => localStorage.removeItem(key));
        return true;
      } catch {
        return false;
      }
    }
  };

  /**
   * Generic method to get all items from a store
   */
  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    await this.ensureInitialized();

    // Use fallback storage if IndexedDB is not available
    if (!this.isIndexedDBAvailable()) {
      const key = `${storeName}-${(data as any).id || Date.now()}`;
      this.fallbackStorage.set(key, data);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to add/update item in store
   */
  private async putInStore<T>(storeName: string, item: T): Promise<void> {
    await this.ensureInitialized();

    // Use fallback storage if IndexedDB is not available
    if (!this.isIndexedDBAvailable()) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`birch-offline-${storeName}-`));
      return keys.map(key => this.fallbackStorage.get(key.replace('birch-offline-', ''))).filter(Boolean);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generic method to delete item from store
   */
  private async deleteFromStore(storeName: string, id: string): Promise<void> {
    await this.ensureInitialized();

    // Use fallback storage if IndexedDB is not available
    if (!this.isIndexedDBAvailable()) {
      this.fallbackStorage.remove(`${storeName}-${id}`);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Convert regular item to offline item with sync metadata
   */
  private addSyncMetadata<T extends { id: string }>(
    item: T,
    syncStatus: SyncStatus = 'synced',
    operation?: SyncOperation
  ): T & { syncStatus: SyncStatus; lastSyncedAt?: number; localModifiedAt: number; pendingOperation?: SyncOperation } {
    return {
      ...item,
      syncStatus,
      lastSyncedAt: syncStatus === 'synced' ? Date.now() : undefined,
      localModifiedAt: Date.now(),
      pendingOperation: operation
    };
  }

  // =============================================================================
  // RECIPE OPERATIONS
  // =============================================================================

  async cacheRecipe(recipe: Recipe, syncStatus: SyncStatus = 'synced'): Promise<void> {
    const offlineRecipe = this.addSyncMetadata(recipe, syncStatus);
    await this.putInStore(STORES.RECIPES, offlineRecipe);
  }

  async getCachedRecipes(): Promise<OfflineRecipe[]> {
    return this.getAllFromStore<OfflineRecipe>(STORES.RECIPES);
  }

  async getCachedRecipe(id: string): Promise<OfflineRecipe | null> {
    await this.ensureInitialized();

    // Use fallback storage if IndexedDB is not available
    if (!this.isIndexedDBAvailable()) {
      return this.fallbackStorage.get(`${STORES.RECIPES}-${id}`);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.RECIPES], 'readonly');
      const store = transaction.objectStore(STORES.RECIPES);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateRecipeSyncStatus(id: string, syncStatus: SyncStatus): Promise<void> {
    const recipe = await this.getCachedRecipe(id);
    if (recipe) {
      recipe.syncStatus = syncStatus;
      recipe.lastSyncedAt = syncStatus === 'synced' ? Date.now() : recipe.lastSyncedAt;
      await this.putInStore(STORES.RECIPES, recipe);
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.deleteFromStore(STORES.RECIPES, id);
  }

  // =============================================================================
  // INGREDIENT OPERATIONS
  // =============================================================================

  async cacheIngredient(ingredient: Ingredient, syncStatus: SyncStatus = 'synced'): Promise<void> {
    const offlineIngredient = this.addSyncMetadata(ingredient, syncStatus);
    await this.putInStore(STORES.INGREDIENTS, offlineIngredient);
  }

  async getCachedIngredients(): Promise<OfflineIngredient[]> {
    return this.getAllFromStore<OfflineIngredient>(STORES.INGREDIENTS);
  }

  async deleteIngredient(id: string): Promise<void> {
    await this.deleteFromStore(STORES.INGREDIENTS, id);
  }

  // =============================================================================
  // TECHNIQUE OPERATIONS
  // =============================================================================

  async cacheTechnique(technique: Technique, syncStatus: SyncStatus = 'synced'): Promise<void> {
    const offlineTechnique = this.addSyncMetadata(technique, syncStatus);
    await this.putInStore(STORES.TECHNIQUES, offlineTechnique);
  }

  async getCachedTechniques(): Promise<OfflineTechnique[]> {
    return this.getAllFromStore<OfflineTechnique>(STORES.TECHNIQUES);
  }

  async deleteTechnique(id: string): Promise<void> {
    await this.deleteFromStore(STORES.TECHNIQUES, id);
  }

  // =============================================================================
  // MENU OPERATIONS
  // =============================================================================

  async cacheMenu(menu: Menu, syncStatus: SyncStatus = 'synced'): Promise<void> {
    const offlineMenu = this.addSyncMetadata(menu, syncStatus);
    await this.putInStore(STORES.MENUS, offlineMenu);
  }

  async getCachedMenus(): Promise<OfflineMenu[]> {
    return this.getAllFromStore<OfflineMenu>(STORES.MENUS);
  }

  async deleteMenu(id: string): Promise<void> {
    await this.deleteFromStore(STORES.MENUS, id);
  }

  // =============================================================================
  // SYNC QUEUE OPERATIONS
  // =============================================================================

  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    await this.putInStore(STORES.SYNC_QUEUE, item);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const items = await this.getAllFromStore<SyncQueueItem>(STORES.SYNC_QUEUE);
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.deleteFromStore(STORES.SYNC_QUEUE, id);
  }

  async clearSyncQueue(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // =============================================================================
  // STORAGE MANAGEMENT
  // =============================================================================

  async getStorageStats(): Promise<OfflineStorageStats> {
    const [recipes, ingredients, techniques, menus] = await Promise.all([
      this.getCachedRecipes(),
      this.getCachedIngredients(),
      this.getCachedTechniques(),
      this.getCachedMenus()
    ]);

    const calculateSize = (items: any[]) => {
      return items.reduce((total, item) => {
        return total + JSON.stringify(item).length * 2; // Rough estimate in bytes
      }, 0);
    };

    const recipeStats = {
      count: recipes.length,
      size: calculateSize(recipes),
      pendingSync: recipes.filter(r => r.syncStatus === 'pending').length
    };

    const ingredientStats = {
      count: ingredients.length,
      size: calculateSize(ingredients),
      pendingSync: ingredients.filter(i => i.syncStatus === 'pending').length
    };

    const techniqueStats = {
      count: techniques.length,
      size: calculateSize(techniques),
      pendingSync: techniques.filter(t => t.syncStatus === 'pending').length
    };

    const menuStats = {
      count: menus.length,
      size: calculateSize(menus),
      pendingSync: menus.filter(m => m.syncStatus === 'pending').length
    };

    const totalSize = recipeStats.size + ingredientStats.size + techniqueStats.size + menuStats.size;

    return {
      totalItems: recipes.length + ingredients.length + techniques.length + menus.length,
      totalSize,
      recipes: recipeStats,
      ingredients: ingredientStats,
      techniques: techniqueStats,
      menus: menuStats,
      images: await this.getImageCacheStats()
    };
  }

  private async getImageCacheStats(): Promise<{ count: number; size: number }> {
    try {
      await this.ensureInitialized();

      // Get all cached images from IndexedDB
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const allImages = await store.getAll();

      let totalSize = 0;
      allImages.forEach(image => {
        if (image.data && image.data.byteLength) {
          totalSize += image.data.byteLength;
        }
      });

      return {
        count: allImages.length,
        size: totalSize
      };
    } catch (error) {
      console.warn('Failed to get image cache stats:', error);
      return { count: 0, size: 0 };
    }
  }

  async cacheImage(url: string, imageData: ArrayBuffer): Promise<void> {
    try {
      await this.ensureInitialized();

      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');

      const imageRecord = {
        url,
        data: imageData,
        cachedAt: new Date().toISOString(),
        size: imageData.byteLength
      };

      await store.put(imageRecord);
    } catch (error) {
      console.error('Failed to cache image:', error);
      throw error;
    }
  }

  async getCachedImage(url: string): Promise<ArrayBuffer | null> {
    try {
      await this.ensureInitialized();

      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const imageRecord = await store.get(url);

      return imageRecord?.data || null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }

  async clearImageCache(): Promise<void> {
    try {
      await this.ensureInitialized();

      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      await store.clear();
    } catch (error) {
      console.error('Failed to clear image cache:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    // Use fallback storage if IndexedDB is not available
    if (!this.isIndexedDBAvailable()) {
      this.fallbackStorage.clear();
      return;
    }

    const storeNames = [STORES.RECIPES, STORES.INGREDIENTS, STORES.TECHNIQUES, STORES.MENUS, STORES.SYNC_QUEUE, 'images'];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, 'readwrite');
      let completed = 0;

      const checkComplete = () => {
        completed++;
        if (completed === storeNames.length) {
          resolve();
        }
      };

      storeNames.forEach(storeName => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = checkComplete;
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
