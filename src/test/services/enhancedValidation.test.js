// =============================================================================
// ENHANCED VALIDATION SERVICE TESTS
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { validationService } from '../../services/validation';

describe('Enhanced API Key Validation', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete import.meta.env.VITE_GEMINI_API_KEY;
    delete import.meta.env.VITE_OPENAI_API_KEY;
    vi.clearAllMocks();
  });

  describe('validateApiKeyDetailed', () => {
    describe('Gemini API Key Validation', () => {
      it('should validate correct Gemini API key format', () => {
        const validKey = 'AIzaSyDummyKeyForTesting123456789012345678901234567890';
        const result = validationService.validateApiKeyDetailed('gemini', validKey);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
        expect(result.source).toBe('manual');
      });

      it('should detect invalid Gemini API key prefix', () => {
        const invalidKey = 'sk-1234567890abcdef1234567890abcdef';
        const result = validationService.validateApiKeyDetailed('gemini', invalidKey);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Gemini API keys must start with "AIza"');
        expect(result.errorCode).toBe('INVALID_PREFIX');
      });

      it('should detect Gemini API key too short', () => {
        const shortKey = 'AIzaShort';
        const result = validationService.validateApiKeyDetailed('gemini', shortKey);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Gemini API keys must be at least 30 characters long');
        expect(result.errorCode).toBe('INVALID_LENGTH');
      });

      it('should detect placeholder Gemini API keys', () => {
        const placeholderKeys = [
          'your_gemini_api_key_here_123456789012345',
          'INSERT_GEMINI_KEY_HERE_123456789012345',
          'AIza_YOUR_API_KEY_HERE_123456789012345',
          'AIzaYOUR_API_KEY_HERE_123456789012345'
        ];

        placeholderKeys.forEach(key => {
          const result = validationService.validateApiKeyDetailed('gemini', key);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('This appears to be a placeholder API key. Please use your actual Gemini API key.');
          expect(result.errorCode).toBe('PLACEHOLDER_KEY');
        });
      });

      it('should provide recovery actions for invalid keys', () => {
        const invalidKey = 'invalid-key';
        const result = validationService.validateApiKeyDetailed('gemini', invalidKey);
        
        expect(result.isValid).toBe(false);
        expect(result.recoveryAction).toEqual({
          type: 'open_settings',
          message: 'Open Settings to configure your Gemini API key',
          url: 'https://makersuite.google.com/app/apikey'
        });
      });
    });

    describe('OpenAI API Key Validation', () => {
      it('should validate correct OpenAI API key format', () => {
        const validKey = 'sk-1234567890abcdef1234567890abcdef1234567890abcdef';
        const result = validationService.validateApiKeyDetailed('openai', validKey);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.source).toBe('manual');
      });

      it('should detect invalid OpenAI API key prefix', () => {
        const invalidKey = 'AIzaSyDummyKeyForTesting123456789012345';
        const result = validationService.validateApiKeyDetailed('openai', invalidKey);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('OpenAI API keys must start with "sk-"');
        expect(result.errorCode).toBe('INVALID_PREFIX');
      });

      it('should detect OpenAI API key too short', () => {
        const shortKey = 'sk-short';
        const result = validationService.validateApiKeyDetailed('openai', shortKey);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('OpenAI API keys must be at least 40 characters long');
        expect(result.errorCode).toBe('INVALID_LENGTH');
      });

      it('should detect placeholder OpenAI API keys', () => {
        const placeholderKeys = [
          'sk-your_openai_api_key_here',
          'sk-INSERT_KEY_HERE_1234567890abcdef',
          'sk-YOUR_API_KEY_HERE_1234567890abcdef1234567890'
        ];

        placeholderKeys.forEach(key => {
          const result = validationService.validateApiKeyDetailed('openai', key);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('This appears to be a placeholder API key. Please use your actual OpenAI API key.');
          expect(result.errorCode).toBe('PLACEHOLDER_KEY');
        });
      });
    });

    describe('Source Tracking', () => {
      it('should detect environment variable source', () => {
        const envKey = 'AIzaEnvKeyFromEnvironment123456789012345678901234567890';
        import.meta.env.VITE_GEMINI_API_KEY = envKey;

        const result = validationService.validateApiKeyDetailed('gemini', envKey);

        expect(result.source).toBe('environment');
        expect(result.sourceDetails).toEqual({
          variable: 'VITE_GEMINI_API_KEY',
          isSecure: true
        });
      });

      it('should detect manual entry source', () => {
        const manualKey = 'AIzaManualKeyFromUser123456789012345678901234567890';

        const result = validationService.validateApiKeyDetailed('gemini', manualKey);

        expect(result.source).toBe('manual');
        expect(result.sourceDetails).toEqual({
          isSecure: false,
          recommendation: 'Consider using environment variables for better security'
        });
      });

      it('should prioritize environment variables over manual entry', () => {
        const envKey = 'AIzaEnvKey123456789012345678901234567890';
        const manualKey = 'AIzaManualKey123456789012345678901234567890';

        import.meta.env.VITE_GEMINI_API_KEY = envKey;

        const result = validationService.validateApiKeyDetailed('gemini', manualKey);

        expect(result.source).toBe('environment');
        expect(result.warnings).toContain('Environment variable takes precedence over manually entered key');
      });
    });

    describe('Edge Cases', () => {
      it('should handle null/undefined API keys', () => {
        const result1 = validationService.validateApiKeyDetailed('gemini', null);
        const result2 = validationService.validateApiKeyDetailed('gemini', undefined);
        const result3 = validationService.validateApiKeyDetailed('gemini', '');
        
        [result1, result2, result3].forEach(result => {
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('API key is required');
          expect(result.errorCode).toBe('MISSING_KEY');
        });
      });

      it('should handle unknown service types', () => {
        const result = validationService.validateApiKeyDetailed('unknown', 'some-long-key-here-123456789');
        
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Unknown service type - using generic validation');
      });

      it('should handle whitespace in API keys', () => {
        const keyWithSpaces = '  AIzaSyDummyKeyForTesting123456789012345678901234567890  ';
        const result = validationService.validateApiKeyDetailed('gemini', keyWithSpaces);

        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('API key had leading/trailing whitespace (automatically trimmed)');
      });

      it('should detect suspicious characters in API keys', () => {
        const suspiciousKey = 'AIzaSyDummyKey<script>alert("xss")</script>';
        const result = validationService.validateApiKeyDetailed('gemini', suspiciousKey);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API key contains invalid characters');
        expect(result.errorCode).toBe('INVALID_CHARACTERS');
      });
    });

    describe('Security Warnings', () => {
      it('should warn about API keys in URLs or logs', () => {
        const keyInUrl = 'AIzaSyDummyKeyForTesting123456789012345678901234567890';
        const result = validationService.validateApiKeyDetailed('gemini', keyInUrl, {
          context: 'url_parameter'
        });

        expect(result.warnings).toContain('API key detected in URL parameter - this is a security risk');
      });

      it('should provide security recommendations', () => {
        const result = validationService.validateApiKeyDetailed('gemini', 'AIzaValidKey123456789012345678901234567890');

        expect(result.securityRecommendations).toContain('Store API keys in environment variables');
        expect(result.securityRecommendations).toContain('Never commit API keys to version control');
        expect(result.securityRecommendations).toContain('Rotate API keys regularly');
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with validateApiKeyFormat', () => {
      // Old function should still work
      expect(validationService.validateApiKeyFormat('gemini', 'AIzaValidKey123456789012345678901234567890')).toBe(true);
      expect(validationService.validateApiKeyFormat('gemini', 'invalid-key')).toBe(false);
    });

    it('should provide migration path to new detailed validation', () => {
      const oldResult = validationService.validateApiKeyFormat('gemini', 'invalid-key');
      const newResult = validationService.validateApiKeyDetailed('gemini', 'invalid-key');
      
      expect(oldResult).toBe(false);
      expect(newResult.isValid).toBe(false);
      expect(newResult.errors.length).toBeGreaterThan(0);
    });
  });
});
