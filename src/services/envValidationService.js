/**
 * Environment Validation Service
 * Validates API keys and environment configuration for security compliance
 */

class EnvValidationService {
  constructor() {
    this.apiKeyPatterns = {
      gemini: /^AIza[0-9A-Za-z-_]{8,}$/,
      openai: /^sk-[a-zA-Z0-9]{48}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9-_]{95}$/
    };
  }

  /**
   * Validate environment configuration
   * @returns {Object} Validation result with security analysis
   */
  validateEnvironment() {
    const result = {
      validated: {
        gemini: this._validateGeminiKey(),
        openai: this._validateOpenAIKey(),
        anthropic: this._validateAnthropicKey()
      },
      security: {
        recommendations: [],
        score: 0,
        level: 'low'
      }
    };

    // Generate security recommendations
    result.security.recommendations = this._generateRecommendations(result.validated);
    
    // Calculate security score
    result.security.score = this._calculateSecurityScore(result);
    
    // Determine security level
    result.security.level = this._getSecurityLevel(result.security.score);

    return result;
  }

  /**
   * Validate Gemini API key
   * @returns {Object} Validation result for Gemini key
   */
  _validateGeminiKey() {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    const result = {
      isValid: false,
      source: null,
      errors: [],
      warnings: []
    };

    if (!key) {
      result.warnings.push('No Gemini API key found in environment');
      return result;
    }

    result.source = 'environment';

    // Validate key format
    if (!this.apiKeyPatterns.gemini.test(key)) {
      result.errors.push('VITE_GEMINI_API_KEY format is invalid. Gemini keys should start with "AIza"');
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Validate OpenAI API key
   * @returns {Object} Validation result for OpenAI key
   */
  _validateOpenAIKey() {
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    const result = {
      isValid: false,
      source: null,
      errors: [],
      warnings: []
    };

    if (!key) {
      result.warnings.push('No OpenAI API key found in environment');
      return result;
    }

    result.source = 'environment';

    // Validate key format
    if (!this.apiKeyPatterns.openai.test(key)) {
      result.errors.push('Invalid OpenAI API key format');
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Validate Anthropic API key
   * @returns {Object} Validation result for Anthropic key
   */
  _validateAnthropicKey() {
    const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const result = {
      isValid: false,
      source: null,
      errors: [],
      warnings: []
    };

    if (!key) {
      result.warnings.push('No Anthropic API key found in environment');
      return result;
    }

    result.source = 'environment';

    // Validate key format
    if (!this.apiKeyPatterns.anthropic.test(key)) {
      result.errors.push('Invalid Anthropic API key format');
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Generate security recommendations based on validation results
   * @param {Object} validated - Validation results for all services
   * @returns {Array} Array of security recommendations
   */
  _generateRecommendations(validated) {
    const recommendations = [];

    // Check if any API keys are configured
    const hasAnyKey = Object.values(validated).some(result => result.isValid);
    
    if (!hasAnyKey) {
      recommendations.push({
        type: 'missing_api_keys',
        priority: 'high',
        category: 'security',
        message: 'No valid API keys found. Configure at least one AI service API key.',
        action: 'Configure API keys in environment variables'
      });
    }

    // Check for invalid key formats
    Object.entries(validated).forEach(([service, result]) => {
      if (result.errors.length > 0) {
        recommendations.push({
          type: 'invalid_key_format',
          priority: 'high',
          category: 'security',
          service,
          message: `Invalid ${service} API key format detected`,
          action: `Verify ${service} API key format and update environment variable`
        });
      }
    });

    // Security best practices
    if (hasAnyKey) {
      recommendations.push({
        type: 'security_best_practice',
        priority: 'medium',
        category: 'security',
        message: 'Ensure API keys are stored securely and not exposed in client-side code',
        action: 'Review API key storage and access patterns'
      });
    }

    return recommendations;
  }

  /**
   * Calculate security score based on validation results
   * @param {Object} result - Complete validation result
   * @returns {number} Security score (0-100)
   */
  _calculateSecurityScore(result) {
    let score = 0;

    const gemini = result.validated.gemini;
    const openai = result.validated.openai;
    const anthropic = result.validated.anthropic;

    if (gemini.isValid) {
      score += 75;
      if (gemini.source === 'environment') {
        score += 15;
      }
    }

    if (openai.isValid) {
      score += 5;
    }

    if (anthropic.isValid) {
      score += 5;
    }

    if (score > 0) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Get security level based on score
   * @param {number} score - Security score
   * @returns {string} Security level
   */
  _getSecurityLevel(score) {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    if (score >= 50) return 'low';
    return 'critical';
  }

  /**
   * Check if environment is production-ready
   * @returns {boolean} True if environment is production-ready
   */
  isProductionReady() {
    const result = this.validateEnvironment();
    return result.security.score >= 70 && 
           Object.values(result.validated).some(r => r.isValid);
  }

  /**
   * Get environment summary
   * @returns {Object} Summary of environment status
   */
  getEnvironmentSummary() {
    const result = this.validateEnvironment();
    
    return {
      isValid: result.security.score >= 50,
      score: result.security.score,
      level: result.security.level,
      validServices: Object.entries(result.validated)
        .filter(([, r]) => r.isValid)
        .map(([service]) => service),
      recommendations: result.security.recommendations.length,
      criticalIssues: result.security.recommendations
        .filter(r => r.priority === 'high').length
    };
  }
}

// Export singleton instance
export const envValidationService = new EnvValidationService();
