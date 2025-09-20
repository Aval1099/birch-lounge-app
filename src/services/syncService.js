// =============================================================================
// HYBRID SYNC SERVICE - OFFLINE-FIRST WITH CLOUD BACKUP
// =============================================================================

import { storageService } from './storageService';
import { supabase, isSupabaseConfigured, getCurrentUser } from './supabaseClient';

// Sync queue for offline changes
let syncQueue = [];
let isOnline = navigator.onLine;
let syncInProgress = false;

/**
 * Sync Service - Manages offline-first data with cloud backup
 */
export const syncService = {
  /**
   * Initialize sync service
   */
  init: async () => {
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load sync queue from localStorage
    syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    
    // Initial sync if online and configured
    if (isOnline && isSupabaseConfigured()) {
      await syncService.syncToCloud();
    }
  },

  /**
   * Save data locally and queue for cloud sync
   * @param {Object} data - Data to save
   * @returns {boolean} Success status
   */
  save: async (data) => {
    // Always save locally first (offline-first)
    const localSaveSuccess = storageService.save(data);
    
    if (!localSaveSuccess) {
      return false;
    }

    // Queue for cloud sync if configured
    if (isSupabaseConfigured()) {
      await queueForSync('save', data);
    }

    return true;
  },

  /**
   * Load data (prioritize local, fallback to cloud)
   * @returns {Object|null} Loaded data
   */
  load: async () => {
    // Always try local first (offline-first)
    const localData = storageService.load();
    
    // If no local data and we're online, try cloud
    if (!localData && isOnline && isSupabaseConfigured()) {
      try {
        const cloudData = await loadFromCloud();
        if (cloudData) {
          // Save cloud data locally for offline access
          storageService.save(cloudData);
          return cloudData;
        }
      } catch (error) {
        console.warn('Failed to load from cloud, using local data:', error);
      }
    }

    return localData;
  },

  /**
   * Sync local data to cloud
   */
  syncToCloud: async () => {
    if (!isSupabaseConfigured() || !isOnline || syncInProgress) {
      return;
    }

    syncInProgress = true;

    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('No user logged in, skipping cloud sync');
        return;
      }

      // Process sync queue
      await processSyncQueue();

      // Sync current data
      const localData = storageService.load();
      if (localData) {
        await saveToCloud(localData, user.id);
      }

    } catch (error) {
      console.error('Cloud sync failed:', error);
    } finally {
      syncInProgress = false;
    }
  },

  /**
   * Get sync status
   * @returns {Object} Sync status info
   */
  getSyncStatus: () => ({
    isOnline,
    isConfigured: isSupabaseConfigured(),
    queueLength: syncQueue.length,
    syncInProgress
  }),

  /**
   * Force sync now (manual trigger)
   */
  forceSync: async () => {
    if (isOnline && isSupabaseConfigured()) {
      await syncService.syncToCloud();
    }
  }
};

/**
 * Handle online event
 */
const handleOnline = async () => {
  isOnline = true;
  console.log('Connection restored, syncing to cloud...');
  
  // Trigger sync after a short delay to ensure connection is stable
  setTimeout(() => {
    syncService.syncToCloud();
  }, 1000);
};

/**
 * Handle offline event
 */
const handleOffline = () => {
  isOnline = false;
  console.log('Connection lost, switching to offline mode');
};

/**
 * Queue data for sync when online
 * @param {string} operation - Operation type
 * @param {Object} data - Data to sync
 */
const queueForSync = async (operation, data) => {
  const syncItem = {
    id: Date.now() + Math.random(),
    operation,
    data,
    timestamp: Date.now()
  };

  syncQueue.push(syncItem);
  
  // Persist queue to localStorage
  localStorage.setItem('syncQueue', JSON.stringify(syncQueue));

  // Try immediate sync if online
  if (isOnline) {
    await syncService.syncToCloud();
  }
};

/**
 * Process sync queue
 */
const processSyncQueue = async () => {
  if (syncQueue.length === 0) return;

  const user = await getCurrentUser();
  if (!user) return;

  const processedItems = [];

  for (const item of syncQueue) {
    try {
      if (item.operation === 'save') {
        await saveToCloud(item.data, user.id);
        processedItems.push(item.id);
      }
    } catch (error) {
      console.error('Failed to process sync item:', error);
      // Keep item in queue for retry
    }
  }

  // Remove processed items from queue
  syncQueue = syncQueue.filter(item => !processedItems.includes(item.id));
  localStorage.setItem('syncQueue', JSON.stringify(syncQueue));
};

/**
 * Save data to cloud (Supabase)
 * @param {Object} data - Data to save
 * @param {string} userId - User ID
 */
const saveToCloud = async (data, userId) => {
  try {
    // Prepare data for cloud storage
    const cloudData = {
      user_id: userId,
      recipes: data.recipes || [],
      ingredients: data.ingredients || [],
      techniques: data.techniques || [],
      saved_menus: data.savedMenus || [],
      saved_batches: data.savedBatches || [],
      theme: data.theme || 'light',
      updated_at: new Date().toISOString(),
      version: data.version || '1.0.0'
    };

    // Upsert user data (insert or update)
    const { error } = await supabase
      .from('user_data')
      .upsert(cloudData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) throw error;

    console.log('Data synced to cloud successfully');
  } catch (error) {
    console.error('Failed to save to cloud:', error);
    throw error;
  }
};

/**
 * Load data from cloud (Supabase)
 * @returns {Object|null} Cloud data
 */
const loadFromCloud = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return null
        return null;
      }
      throw error;
    }

    // Transform cloud data back to app format
    return {
      recipes: data.recipes || [],
      ingredients: data.ingredients || [],
      techniques: data.techniques || [],
      savedMenus: data.saved_menus || [],
      savedBatches: data.saved_batches || [],
      theme: data.theme || 'light',
      version: data.version || '1.0.0',
      lastSaved: new Date(data.updated_at).getTime()
    };
  } catch (error) {
    console.error('Failed to load from cloud:', error);
    throw error;
  }
};
