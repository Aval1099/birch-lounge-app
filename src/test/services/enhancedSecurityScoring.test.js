import { describe, it, expect } from 'vitest';

import { validationService } from '../../services/validation.js';

describe('Enhanced Security Scoring', () => {
  describe('getSecurityScore', () => {
    it('should return perfect score for optimal configuration', () => {
      const config = {
        apiKeys: {
          gemini: 'AIzaSyValidKey123456789012345678901234567890'
        },
        environment: 'production',
        storageMethod: 'cloud',
        encryptionEnabled: true,
        httpsEnabled: true,
        corsEnabled: false,
        debugMode: false,
        logLevel: 'error'
      };

      // Mock environment variables
      const originalEnv = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'AIzaSyValidKey123456789012345678901234567890';

      const result = validationService.getSecurityScore(config);

      // Restore environment
      if (originalEnv) {
        process.env.GEMINI_API_KEY = originalEnv;
      } else {
        delete process.env.GEMINI_API_KEY;
      }

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.securityLevel).toBe('excellent');
      expect(result.strengths).toContain('API keys are configured');
      expect(result.strengths).toContain('Running in production environment');
      expect(result.strengths).toContain('Using cloud storage (most secure option)');
      expect(result.strengths).toContain('HTTPS enabled for secure communication');
      expect(result.strengths).toContain('CORS properly configured');
      expect(result.summary.totalIssues).toBeLessThanOrEqual(2);
    });

    it('should detect critical security issues', () => {
      const config = {
        apiKeys: {
          gemini: 'your_api_key_here'
        },
        environment: 'production',
        storageMethod: 'localStorage',
        encryptionEnabled: false,
        httpsEnabled: false,
        corsEnabled: true,
        debugMode: true,
        logLevel: 'debug'
      };

      const result = validationService.getSecurityScore(config);

      expect(result.score).toBeLessThan(60); // Should be in critical range
      expect(result.securityLevel).toBe('critical');
      expect(result.summary.criticalIssues).toBeGreaterThan(0);
      
      // Check for specific critical issues
      const issueTypes = result.issues.map(issue => issue.type);
      expect(issueTypes).toContain('placeholder_api_key');
      expect(issueTypes).toContain('debug_mode_in_production');
      expect(issueTypes).toContain('https_not_enabled');
      expect(issueTypes).toContain('unencrypted_local_storage');
    });

    it('should handle missing API keys correctly', () => {
      const config = {
        apiKeys: {},
        environment: 'development',
        storageMethod: 'localStorage',
        encryptionEnabled: false,
        httpsEnabled: true,
        corsEnabled: false,
        debugMode: false,
        logLevel: 'info'
      };

      const result = validationService.getSecurityScore(config);

      expect(result.issues.some(issue => issue.type === 'missing_api_keys')).toBe(true);
      expect(result.recommendations.some(rec => rec.type === 'configure_api_keys')).toBe(true);
      expect(result.score).toBeLessThan(100);
    });

    it('should validate API key formats in security assessment', () => {
      const config = {
        apiKeys: {
          gemini: 'invalid-key',
          openai: 'sk-validOpenAIKey123456789012345678901234567890123456'
        },
        environment: 'development',
        storageMethod: 'localStorage',
        encryptionEnabled: false,
        httpsEnabled: true,
        corsEnabled: false,
        debugMode: false,
        logLevel: 'info'
      };

      const result = validationService.getSecurityScore(config);

      const invalidFormatIssue = result.issues.find(issue => 
        issue.type === 'invalid_api_key_format' && issue.message.includes('gemini')
      );
      expect(invalidFormatIssue).toBeDefined();
      expect(invalidFormatIssue.severity).toBe(7);

      // Should have strength for valid OpenAI key
      expect(result.strengths.some(strength => 
        strength.includes('Valid openai API key format')
      )).toBe(true);
    });

    it('should assess environment security correctly', () => {
      const productionConfig = {
        apiKeys: { gemini: 'AIzaSyValidKey123456789012345678901234567890' },
        environment: 'production',
        debugMode: true,
        logLevel: 'debug'
      };

      const result = validationService.getSecurityScore(productionConfig);

      expect(result.issues.some(issue => issue.type === 'debug_mode_in_production')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'verbose_logging_in_production')).toBe(true);
      expect(result.recommendations.some(rec => rec.type === 'disable_debug_mode')).toBe(true);
    });

    it('should assess storage security correctly', () => {
      const configs = [
        {
          storageMethod: 'localStorage',
          encryptionEnabled: false,
          expectedIssue: 'unencrypted_local_storage'
        },
        {
          storageMethod: 'sessionStorage',
          encryptionEnabled: false,
          expectedIssue: 'unencrypted_session_storage'
        },
        {
          storageMethod: 'indexedDB',
          encryptionEnabled: false,
          expectedIssue: 'unencrypted_indexeddb'
        },
        {
          storageMethod: 'cloud',
          encryptionEnabled: false,
          expectedIssue: null // Cloud storage is considered secure
        }
      ];

      configs.forEach(({ storageMethod, encryptionEnabled, expectedIssue }) => {
        const config = {
          apiKeys: { gemini: 'AIzaSyValidKey123456789012345678901234567890' },
          storageMethod,
          encryptionEnabled
        };

        const result = validationService.getSecurityScore(config);

        if (expectedIssue) {
          expect(result.issues.some(issue => issue.type === expectedIssue)).toBe(true);
        } else {
          expect(result.strengths.some(strength => 
            strength.includes('cloud storage')
          )).toBe(true);
        }
      });
    });

    it('should assess network security correctly', () => {
      const insecureConfig = {
        apiKeys: { gemini: 'AIzaSyValidKey123456789012345678901234567890' },
        httpsEnabled: false,
        corsEnabled: true
      };

      const result = validationService.getSecurityScore(insecureConfig);

      expect(result.issues.some(issue => issue.type === 'https_not_enabled')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'cors_enabled')).toBe(true);
      expect(result.recommendations.some(rec => rec.type === 'enable_https')).toBe(true);
    });

    it('should sort issues by severity and recommendations by priority', () => {
      const config = {
        apiKeys: {
          gemini: 'your_api_key_here'
        },
        environment: 'production',
        storageMethod: 'localStorage',
        encryptionEnabled: false,
        httpsEnabled: false,
        corsEnabled: true,
        debugMode: true,
        logLevel: 'debug'
      };

      const result = validationService.getSecurityScore(config);

      // Check that issues are sorted by severity (descending)
      for (let i = 0; i < result.issues.length - 1; i++) {
        expect(result.issues[i].severity).toBeGreaterThanOrEqual(result.issues[i + 1].severity);
      }

      // Check that recommendations are sorted by priority (descending)
      for (let i = 0; i < result.recommendations.length - 1; i++) {
        expect(result.recommendations[i].priority).toBeGreaterThanOrEqual(result.recommendations[i + 1].priority);
      }
    });

    it('should provide comprehensive summary statistics', () => {
      const config = {
        apiKeys: {
          gemini: 'your_api_key_here'
        },
        environment: 'production',
        storageMethod: 'localStorage',
        encryptionEnabled: false,
        httpsEnabled: false,
        corsEnabled: true,
        debugMode: true,
        logLevel: 'debug'
      };

      const result = validationService.getSecurityScore(config);

      expect(result.summary).toHaveProperty('totalIssues');
      expect(result.summary).toHaveProperty('criticalIssues');
      expect(result.summary).toHaveProperty('highIssues');
      expect(result.summary).toHaveProperty('mediumIssues');
      expect(result.summary).toHaveProperty('lowIssues');
      expect(result.summary).toHaveProperty('totalRecommendations');
      expect(result.summary).toHaveProperty('highPriorityRecommendations');

      // Verify counts add up correctly
      const totalCalculated = result.summary.criticalIssues + 
                             result.summary.highIssues + 
                             result.summary.mediumIssues + 
                             result.summary.lowIssues;
      expect(totalCalculated).toBe(result.summary.totalIssues);
    });

    it('should include timestamp in results', () => {
      const config = {
        apiKeys: { gemini: 'AIzaSyValidKey123456789012345678901234567890' }
      };

      const result = validationService.getSecurityScore(config);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle empty API key values', () => {
      const config = {
        apiKeys: {
          gemini: '',
          openai: '   '
        }
      };

      const result = validationService.getSecurityScore(config);

      const emptyKeyIssues = result.issues.filter(issue => issue.type === 'empty_api_key');
      expect(emptyKeyIssues).toHaveLength(2);
      expect(emptyKeyIssues[0].severity).toBe(7);
    });

    it('should detect environment variable usage for API keys', () => {
      const config = {
        apiKeys: {
          gemini: 'AIzaSyValidKey123456789012345678901234567890'
        }
      };

      // Test without environment variable
      const resultWithoutEnv = validationService.getSecurityScore(config);
      expect(resultWithoutEnv.issues.some(issue => 
        issue.type === 'api_key_not_in_env'
      )).toBe(true);

      // Test with environment variable
      const originalEnv = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'AIzaSyValidKey123456789012345678901234567890';

      const resultWithEnv = validationService.getSecurityScore(config);
      expect(resultWithEnv.strengths.some(strength => 
        strength.includes('gemini API key stored in environment variables')
      )).toBe(true);

      // Restore environment
      if (originalEnv) {
        process.env.GEMINI_API_KEY = originalEnv;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    });

    it('should handle unknown storage methods and environments', () => {
      const config = {
        apiKeys: { gemini: 'AIzaSyValidKey123456789012345678901234567890' },
        environment: 'staging',
        storageMethod: 'customStorage'
      };

      const result = validationService.getSecurityScore(config);

      expect(result.issues.some(issue => issue.type === 'unknown_environment')).toBe(true);
      expect(result.issues.some(issue => issue.type === 'unknown_storage_method')).toBe(true);
    });
  });
});
