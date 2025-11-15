// =============================================================================
// SECURE API KEY MANAGEMENT SERVICE
// =============================================================================

/**
 * Secure API Key Management Service
 *
 * This service provides secure storage and management for API keys,
 * replacing the vulnerable localStorage approach with a more secure
 * implementation that uses environment variables and secure in-memory storage.
 */
export const apiKeyService = {
  // In-memory storage for API keys (cleared on page refresh)
  _apiKeyStore: new Map(),

  // Key rotation tracking
  _keyRotationTimestamps: new Map(),

  // Cleanup interval for expired keys
  _cleanupInterval: null,

  // Environment variable prefix
  _envPrefix: 'VITE_',

  /**
   * Ensure internal storage Maps exist. Helpful for tests that partially mock the service.
   * @private
   */
  _ensureInternalStores: () => {
    if (!(apiKeyService._apiKeyStore instanceof Map)) {
      apiKeyService._apiKeyStore = new Map();
    }

    if (!(apiKeyService._keyRotationTimestamps instanceof Map)) {
      apiKeyService._keyRotationTimestamps = new Map();
    }
  },

  /**
   * Initialize the API key service
   */
  init: () => {
    apiKeyService._ensureInternalStores();
    // Reset in-memory storage to simulate a fresh session
    apiKeyService._apiKeyStore.clear();
    apiKeyService._keyRotationTimestamps.clear();

    // Clear any existing localStorage API keys (migration cleanup)
    apiKeyService._clearLegacyStorage();

    // Load API keys from environment variables
    apiKeyService._loadEnvironmentKeys();

    // API Key Service initialized securely
  },

  /**
   * Store API key securely in memory only
   * @param {string} serviceName - Name of the service (e.g., 'gemini')
   * @param {string} apiKey - The API key to store
   * @param {Object} options - Additional options
   * @returns {boolean} Success status
   */
  setApiKey: (serviceName, apiKey, options = {}) => {
    apiKeyService._ensureInternalStores();
    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error('Service name is required and must be a string');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required and must be a string');
    }

    const sanitizedServiceName = apiKeyService._sanitizeServiceName(serviceName);

    if (!sanitizedServiceName || sanitizedServiceName.length < 2) {
      throw new Error('Invalid service name format after sanitization');
    }

    // Validate API key format before storing (unless bypassed for environment keys)
    if (!options.bypassValidation && !apiKeyService._validateApiKeyFormat(sanitizedServiceName, apiKey)) {
      throw new Error('Invalid API key format');
    }

    // Store in memory only with expiration mechanism (default 24 hours)
    const expirationTime = options.expiration || 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    apiKeyService._apiKeyStore.set(sanitizedServiceName, {
      key: apiKey,
      timestamp: Date.now(),
      expiration: Date.now() + expirationTime,
      ...options
    });

    // Set up automatic cleanup for expired keys
    apiKeyService._setupKeyCleanup();

    // Track key rotation if specified
    if (options.rotateKey) {
      apiKeyService._keyRotationTimestamps.set(sanitizedServiceName, Date.now());
    }

    // API key stored securely in memory
    return true;
  },

  /**
   * Retrieve API key securely
   * @param {string} serviceName - Name of the service
   * @returns {string|null} The API key or null if not found
   */
  getApiKey: (serviceName) => {
    apiKeyService._ensureInternalStores();
    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error('Service name is required and must be a string');
    }

    const sanitizedServiceName = apiKeyService._sanitizeServiceName(serviceName);

    // First check environment variables (highest priority)
    const envKey = apiKeyService._getEnvironmentKey(sanitizedServiceName);
    if (envKey) {
      return envKey;
    }

    // Then check in-memory storage
    const stored = apiKeyService._apiKeyStore.get(sanitizedServiceName);
    if (stored && stored.key) {
      // Check if key has expired (using new expiration mechanism)
      const now = Date.now();
      if (stored.expiration && now > stored.expiration) {
        apiKeyService._apiKeyStore.delete(serviceName);
        console.warn(`API key for ${serviceName} has expired and was removed`);
        return null;
      }

      // Fallback to old TTL mechanism for backward compatibility
      if (stored.ttl && now - stored.timestamp > stored.ttl) {
        apiKeyService._apiKeyStore.delete(serviceName);
        console.warn(`API key for ${serviceName} has expired (TTL) and was removed`);
        return null;
      }

      return stored.key;
    }

    return null;
  },

  /**
   * Remove API key securely
   * @param {string} serviceName - Name of the service
   * @returns {boolean} Success status
   */
  removeApiKey: (serviceName) => {
    apiKeyService._ensureInternalStores();
    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error('Service name is required and must be a string');
    }

    const sanitizedServiceName = apiKeyService._sanitizeServiceName(serviceName);

    const deleted = apiKeyService._apiKeyStore.delete(sanitizedServiceName);
    apiKeyService._keyRotationTimestamps.delete(sanitizedServiceName);

    if (deleted) {
      // API key removed securely
    }

    return deleted;
  },

  /**
   * Check if API key exists
   * @param {string} serviceName - Name of the service
   * @returns {boolean} True if key exists
   */
  hasApiKey: (serviceName) => {
    return apiKeyService.getApiKey(serviceName) !== null;
  },

  /**
   * Clear all API keys from memory
   * @returns {boolean} Success status
   */
  clearAllKeys: () => {
    apiKeyService._ensureInternalStores();
    try {
      apiKeyService._apiKeyStore.clear();
      apiKeyService._keyRotationTimestamps.clear();

      // Clear cleanup interval if it exists
      if (apiKeyService._cleanupInterval) {
        clearInterval(apiKeyService._cleanupInterval);
        apiKeyService._cleanupInterval = null;
      }

      return true;
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      return false;
    }
  },

  /**
   * Get service status without exposing keys
   * @returns {Object} Service status information
   */
  getStatus: () => {
    apiKeyService._ensureInternalStores();
    const services = Array.from(apiKeyService._apiKeyStore.keys());
    const envServices = [];

    // Check for environment keys without exposing them
    if (apiKeyService._getEnvironmentKey('gemini')) {
      envServices.push('gemini');
    }
    if (apiKeyService._getEnvironmentKey('openai')) {
      envServices.push('openai');
    }

    return {
      services: [...new Set([...services, ...envServices])],
      memoryKeys: services.length,
      keysInMemory: services.length,
      environmentKeys: envServices.length,
      hasKeys: services.length > 0 || envServices.length > 0
    };
  },

  /**
   * Rotate API key securely
   * @param {string} serviceName - Name of the service
   * @param {string} newApiKey - The new API key
   * @returns {boolean} Success status
   */
  rotateApiKey: (serviceName, newApiKey) => {
    apiKeyService._ensureInternalStores();
    if (!serviceName || typeof serviceName !== 'string') {
      throw new Error('Service name is required and must be a string');
    }

    if (!newApiKey || typeof newApiKey !== 'string') {
      throw new Error('New API key is required and must be a string');
    }

    const sanitizedServiceName = apiKeyService._sanitizeServiceName(serviceName);

    // Validate new key format
    if (!apiKeyService._validateApiKeyFormat(sanitizedServiceName, newApiKey)) {
      throw new Error('Invalid API key format');
    }

    // Get current key for logging
    const currentKey = apiKeyService.getApiKey(sanitizedServiceName);

    // Set new key with rotation flag
    apiKeyService.setApiKey(sanitizedServiceName, newApiKey, {
      rotateKey: true,
      previousKeyHash: currentKey ? apiKeyService._hashKey(currentKey) : null
    });

    // API key rotated successfully
    return true;
  },

  /**
   * Get key rotation information
   * @param {string} serviceName - Name of the service
   * @returns {Object} Rotation information
   */
  getKeyRotationInfo: (serviceName) => {
    apiKeyService._ensureInternalStores();
    const sanitizedServiceName = apiKeyService._sanitizeServiceName(serviceName);
    const timestamp = apiKeyService._keyRotationTimestamps.get(sanitizedServiceName);
    const stored = apiKeyService._apiKeyStore.get(sanitizedServiceName);

    return {
      lastRotated: timestamp || null,
      hasPreviousKey: Boolean(stored && stored.previousKeyHash),
      keyAge: timestamp ? Date.now() - timestamp : null
    };
  },

  /**
   * Validate API key format for specific service
   * @param {string} serviceName - Name of the service
   * @param {string} apiKey - The API key to validate
   * @returns {boolean} True if format is valid
   * @private
   */
  _validateApiKeyFormat: (serviceName, apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    const normalizedKey = apiKey.trim();

    switch (serviceName.toLowerCase()) {
      case 'gemini':
        return /^AIza[0-9A-Za-z-_]{8,}$/.test(normalizedKey);
      case 'openai':
        return /^sk-[0-9A-Za-z-_]{10,}$/.test(normalizedKey);
      default:
        return /^[a-zA-Z0-9\-_]{8,}$/.test(normalizedKey);
    }
  },

  /**
   * Get API key from environment variables
   * @param {string} serviceName - Name of the service
   * @returns {string|null} The API key or null if not found
   * @private
   */
  _getEnvironmentKey: (serviceName) => {
    const envVarName = `${apiKeyService._envPrefix}${serviceName.toUpperCase()}_API_KEY`;
    const envKey = import.meta.env[envVarName];

    if (envKey && envKey.trim()) {
      // Using API key from environment variable
      return envKey.trim();
    }

    return null;
  },

  /**
   * Load API keys from environment variables
   * @private
   */
  _loadEnvironmentKeys: () => {
    // Load Gemini API key if available
    const geminiKey = apiKeyService._getEnvironmentKey('gemini');
    if (geminiKey) {
      apiKeyService.setApiKey('gemini', geminiKey, {
        source: 'environment',
        bypassValidation: true // Skip validation for environment keys during initialization
      });
    }

    // Add other services as needed
    const openaiKey = apiKeyService._getEnvironmentKey('openai');
    if (openaiKey) {
      apiKeyService.setApiKey('openai', openaiKey, {
        source: 'environment',
        bypassValidation: true // Skip validation for environment keys during initialization
      });
    }
  },

  /**
   * Clear legacy localStorage API keys (migration cleanup)
   * @private
   */
  _clearLegacyStorage: () => {
    try {
      const legacyKeys = ['gemini-api-key', 'openai-api-key'];
      legacyKeys.forEach(key => {
        // Always call removeItem to ensure cleanup, even if key doesn't exist
        localStorage.removeItem(key);
        // Removed legacy API key from localStorage
      });
    } catch (error) {
      console.warn('Failed to clear legacy localStorage keys:', error);
    }
  },

  /**
   * Set up automatic cleanup for expired API keys
   * @private
   */
  _setupKeyCleanup: () => {
    apiKeyService._ensureInternalStores();
    // Clean up expired keys immediately
    apiKeyService._cleanupExpiredKeys();

    // Set up periodic cleanup every hour
    if (apiKeyService._cleanupInterval) {
      clearInterval(apiKeyService._cleanupInterval);
    }

    apiKeyService._cleanupInterval = setInterval(() => {
      apiKeyService._cleanupExpiredKeys();
    }, 60 * 60 * 1000); // 1 hour
  },

  /**
   * Clean up expired API keys
   * @private
   */
  _cleanupExpiredKeys: () => {
    apiKeyService._ensureInternalStores();
    const now = Date.now();
    const expiredKeys = [];

    for (const [serviceName, keyData] of apiKeyService._apiKeyStore.entries()) {
      if (keyData.expiration && now > keyData.expiration) {
        expiredKeys.push(serviceName);
      }
    }

    expiredKeys.forEach(serviceName => {
      apiKeyService._apiKeyStore.delete(serviceName);
      // Removed expired API key for service
    });

    if (expiredKeys.length > 0) {
      // Cleaned up expired API keys
    }
  },

  /**
   * Create a simple hash of the key for comparison (not for security)
   * @param {string} key - The API key to hash
   * @returns {string} Hashed key
   * @private
   */
  _hashKey: (key) => {
    // Simple hash for comparison purposes only
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  },



  /**
   * Check if legacy localStorage keys exist
   * @returns {boolean} True if legacy keys exist
   * @private
   */
  _hasLegacyKeys: () => {
    try {
      const legacyKeys = ['gemini-api-key', 'openai-api-key'];
      return legacyKeys.some(key => localStorage.getItem(key) !== null);
    } catch {
      return false;
    }
  },

  /**
   * Normalize service names for consistent internal storage
   * @param {string} serviceName - Raw service name
   * @returns {string} Normalized service name
   * @private
   */
  _sanitizeServiceName: (serviceName) => {
    return serviceName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '')
      .replace(/^[^a-z]/, '')
      .substring(0, 50);
  }
};

// Initialize the service when imported
apiKeyService.init();
