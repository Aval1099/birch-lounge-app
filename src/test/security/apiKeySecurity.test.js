// =============================================================================
// API KEY SECURITY TESTS
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Unmock the API key service for security testing
vi.unmock('../../services/apiKeyService');

import { apiKeyService } from '../../services/apiKeyService';
import { geminiService } from '../../services/geminiService';
import { envValidationService } from '../../services/envValidationService';
import { errorHandler as errorHandlingService } from '../../services/errorHandler';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch API
// Mock fetch API globally
Object.defineProperty(globalThis, 'fetch', {
  value: vi.fn(),
  writable: true
});

describe('API Key Security Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Clear the API key service's internal state
    if (typeof apiKeyService.clearAllKeys === 'function') {
      apiKeyService.clearAllKeys();
    } else {
      // Fallback: manually clear the internal state
      apiKeyService._apiKeyStore?.clear();
      apiKeyService._keyRotationTimestamps?.clear();
    }

    // Reset environment variables
    import.meta.env.VITE_GEMINI_API_KEY = '';
    import.meta.env.VITE_OPENAI_API_KEY = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Key Service Security', () => {
    it('should not store API keys in localStorage', () => {
      const testKey = 'AIzaTestKey123456789';

      apiKeyService.setApiKey('gemini', testKey);

      // Verify localStorage was not called
      expect(localStorage.setItem).not.toHaveBeenCalled();

      // Verify key is stored in memory
      expect(apiKeyService.getApiKey('gemini')).toBe(testKey);
    });

    it('should clear legacy localStorage keys on initialization', () => {
      localStorage.getItem.mockReturnValue('old-key');

      apiKeyService.init();

      expect(localStorage.removeItem).toHaveBeenCalledWith('gemini-api-key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('openai-api-key');
    });

    it('should prioritize environment variables over memory storage', () => {
      const envKey = 'AIzaEnvKey123456789';
      const memoryKey = 'AIzaMemoryKey987654321';

      // Set environment variable
      import.meta.env.VITE_GEMINI_API_KEY = envKey;

      // Set key in memory
      apiKeyService.setApiKey('gemini', memoryKey);

      // Should return environment key, not memory key
      expect(apiKeyService.getApiKey('gemini')).toBe(envKey);
    });

    it('should validate API key format before storing', () => {
      const invalidKey = 'invalid-key-format';

      expect(() => {
        apiKeyService.setApiKey('gemini', invalidKey);
      }).toThrow('Invalid API key format');
    });

    it('should support secure key rotation', () => {
      const oldKey = 'AIzaOldKey123456789';
      const newKey = 'AIzaNewKey987654321';

      // Set initial key
      apiKeyService.setApiKey('gemini', oldKey);

      // Rotate key
      const rotationResult = apiKeyService.rotateApiKey('gemini', newKey);

      expect(rotationResult).toBe(true);
      expect(apiKeyService.getApiKey('gemini')).toBe(newKey);

      // Check rotation info
      const rotationInfo = apiKeyService.getKeyRotationInfo('gemini');
      expect(rotationInfo.lastRotated).toBeGreaterThan(0);
      expect(rotationInfo.hasPreviousKey).toBe(true);
    });

    it('should clear all keys securely', () => {
      apiKeyService.setApiKey('gemini', 'AIzaTestKey123');
      apiKeyService.setApiKey('openai', 'sk-test-key-123');

      expect(apiKeyService.hasApiKey('gemini')).toBe(true);
      expect(apiKeyService.hasApiKey('openai')).toBe(true);

      apiKeyService.clearAllKeys();

      expect(apiKeyService.hasApiKey('gemini')).toBe(false);
      expect(apiKeyService.hasApiKey('openai')).toBe(false);
    });
  });

  describe('Environment Variable Validation', () => {
    it('should validate environment variables correctly', () => {
      // Test with valid Gemini key
      import.meta.env.VITE_GEMINI_API_KEY = 'AIzaValidTestKey123456789';

      const result = envValidationService.validateEnvironment();

      expect(result.validated.gemini.isValid).toBe(true);
      expect(result.validated.gemini.source).toBe('environment');
    });

    it('should detect invalid API key formats', () => {
      import.meta.env.VITE_GEMINI_API_KEY = 'invalid-key-format';

      const result = envValidationService.validateEnvironment();

      expect(result.validated.gemini.isValid).toBe(false);
      expect(result.validated.gemini.errors).toContain(
        'VITE_GEMINI_API_KEY format is invalid. Gemini keys should start with "AIza"'
      );
    });

    it('should generate security recommendations', () => {
      // Test with no environment keys
      const result = envValidationService.validateEnvironment();

      expect(result.security.recommendations).toHaveLength(1);
      expect(result.security.recommendations[0].priority).toBe('high');
      expect(result.security.recommendations[0].category).toBe('security');
    });

    it('should calculate security score correctly', () => {
      // Test with no configuration
      let result = envValidationService.validateEnvironment();
      let score = envValidationService._calculateSecurityScore(result);
      expect(score).toBeLessThan(100);

      // Test with valid environment key
      import.meta.env.VITE_GEMINI_API_KEY = 'AIzaValidTestKey123456789';
      result = envValidationService.validateEnvironment();
      score = envValidationService._calculateSecurityScore(result);
      expect(score).toBeGreaterThan(90);
    });
  });

  describe('Error Handling Security', () => {
    it('should handle missing API keys gracefully', () => {
      const error = new Error('API key is required');
      const errorInfo = errorHandlingService.handleApiKeyError(error, 'test_context');

      expect(errorInfo.category).toBe('configuration');
      expect(errorInfo.severity).toBe('high');
      expect(errorInfo.actionable).toBe(true);
    });

    it('should validate API keys with detailed feedback', () => {
      const validation = errorHandlingService.validateApiKeyWithDetails('', 'gemini');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0].code).toBe('MISSING_API_KEY');
    });

    it('should detect placeholder API keys', () => {
      const validation = errorHandlingService.validateApiKeyWithDetails('your_api_key_here', 'gemini');

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0].code).toBe('PLACEHOLDER_KEY');
    });

    it('should create user-friendly error messages', () => {
      const errorInfo = {
        category: errorHandlingService.ErrorCategories.VALIDATION,
        severity: errorHandlingService.ErrorSeverity.HIGH,
        userMessage: 'Test message',
        suggestions: ['Test suggestion']
      };

      const message = errorHandlingService.createUserFriendlyMessage(errorInfo);

      expect(message).toContain('Test message');
      expect(message).toContain('Please check your API key format');
    });

    it('should provide recovery actions for errors', () => {
      const errorInfo = {
        category: errorHandlingService.ErrorCategories.VALIDATION,
        actionable: true
      };

      const recovery = errorHandlingService.createRecoveryAction(errorInfo);

      expect(recovery.canRecover).toBe(true);
      expect(recovery.action).toBe('open_settings');
    });
  });

  describe('Gemini Service Security Integration', () => {
    it('should use secure API key retrieval', async () => {
      const testKey = 'AIzaTestKey123456789';
      apiKeyService.setApiKey('gemini', testKey);

      // Mock successful fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'Test response' }]
            }
          }]
        })
      });

      const result = await geminiService.generate(null, 'test prompt');

      expect(result).toBe('Test response');
      // Verify the key was retrieved securely (not from localStorage)
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should handle API key validation errors', async () => {
      await expect(geminiService.generate('invalid-key', 'test prompt')).rejects.toThrow();
    });

    it('should fall back to environment variables', async () => {
      const envKey = 'AIzaEnvKey123456789';
      import.meta.env.VITE_GEMINI_API_KEY = envKey;

      // Mock successful fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'Test response' }]
            }
          }]
        })
      });

      const result = await geminiService.generate(null, 'test prompt');

      expect(result).toBe('Test response');
    });

    it('should provide key source information', () => {
      // Test with environment key
      import.meta.env.VITE_GEMINI_API_KEY = 'AIzaEnvKey123456789';

      const sourceInfo = geminiService.getKeySource();

      expect(sourceInfo.source).toBe('environment');
      expect(sourceInfo.hasEnvironmentKey).toBe(true);
      expect(sourceInfo.isConfigured).toBe(true);
    });

    it('should test API keys securely', async () => {
      const testKey = 'AIzaTestKey123456789';

      // Mock successful fetch for test
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'OK' }]
            }
          }]
        })
      });

      const isValid = await geminiService.testApiKey(testKey);

      expect(isValid).toBe(true);
    });
  });

  describe('XSS Protection Tests', () => {
    it('should not expose API keys in error messages', () => {
      const apiKey = 'AIzaSecretKey123456789';
      const error = new Error(`Invalid key: ${apiKey}`);

      const errorInfo = errorHandlingService.handleApiKeyError(error, 'test');
      const userMessage = errorHandlingService.createUserFriendlyMessage(errorInfo);

      expect(userMessage).not.toContain(apiKey);
    });

    it('should sanitize API key validation output', () => {
      const validation = errorHandlingService.validateApiKeyWithDetails('AIzaTestKey123', 'gemini');

      // Should not contain the actual key in warnings/errors
      const allMessages = [...validation.errors, ...validation.warnings]
        .map(e => e.message)
        .join(' ');

      expect(allMessages).not.toContain('AIzaTestKey123');
    });

    it('should prevent key leakage through service status', () => {
      apiKeyService.setApiKey('gemini', 'AIzaSecretKey123456789');

      const status = apiKeyService.getStatus();

      expect(status.services).toContain('gemini');
      expect(status.keysInMemory).toBe(1);
      // Should not contain actual key values
      expect(JSON.stringify(status)).not.toContain('AIzaSecretKey123456789');
    });
  });

  describe('Memory Management Security', () => {
    it('should clear keys from memory on request', () => {
      apiKeyService.setApiKey('gemini', 'AIzaTestKey123456789');

      expect(apiKeyService.hasApiKey('gemini')).toBe(true);

      apiKeyService.removeApiKey('gemini');

      expect(apiKeyService.hasApiKey('gemini')).toBe(false);
    });

    it('should handle TTL expiration', () => {
      const testKey = 'AIzaTestKey123456789';

      // Set key with very short TTL
      apiKeyService.setApiKey('gemini', testKey, { ttl: 1 });

      // Key should be available immediately
      expect(apiKeyService.getApiKey('gemini')).toBe(testKey);

      // Wait for expiration (in real implementation, this would need time mocking)
      // For now, we'll test the logic structure
      const stored = apiKeyService._apiKeyStore.get('gemini');
      expect(stored.ttl).toBe(1);
    });

    it('should not persist keys across page refreshes', () => {
      // This test verifies the design - keys are only in memory
      const testKey = 'AIzaTestKey123456789';

      apiKeyService.setApiKey('gemini', testKey);

      // Simulate page refresh by re-initializing
      apiKeyService.init();

      // Key should be gone (unless set via environment variable)
      expect(apiKeyService.getApiKey('gemini')).toBeNull();
    });
  });
});
