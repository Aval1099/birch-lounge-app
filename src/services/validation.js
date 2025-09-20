// =============================================================================
// SIMPLIFIED VALIDATION SERVICE
// =============================================================================

import { createIngredient, createRecipe, validateRecipe, validateIngredient } from '../models/index.js';

/**
 * Simplified validation service combining environment and import validation
 */
export const validationService = {
  // File validation constants
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_STRING_LENGTH: 10000,
  ALLOWED_MIME_TYPES: ['application/json'],

  /**
   * Validate environment configuration
   * @returns {Object} Validation results
   */
  validateEnvironment: () => {
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      gemini: { isConfigured: false },
      supabase: { isConfigured: false }
    };

    // Check Gemini API key
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey && geminiKey.length > 10) {
      results.gemini.isConfigured = true;
    } else {
      results.warnings.push('Gemini API key not configured - AI features will be disabled');
    }

    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      results.supabase.isConfigured = true;
    } else {
      results.warnings.push('Supabase not configured - cloud sync will be disabled');
    }

    return results;
  },

  /**
   * Validate file for import
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  validateFile: (file) => {
    const errors = [];

    if (file.size > validationService.MAX_FILE_SIZE) {
      errors.push(`File too large. Maximum size: ${validationService.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    if (!validationService.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push('Invalid file type. Only JSON files are allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate and sanitize JSON data for import
   * @param {string} jsonString - JSON string to validate
   * @returns {Object} Validation result with sanitized data
   */
  validateImportData: (jsonString) => {
    try {
      // Basic length check
      if (jsonString.length > validationService.MAX_STRING_LENGTH) {
        return {
          isValid: false,
          errors: ['File content too large'],
          data: null
        };
      }

      // Parse JSON
      const data = JSON.parse(jsonString);
      
      // Validate structure
      const validatedData = {
        recipes: [],
        ingredients: [],
        savedMenus: [],
        savedBatches: [],
        techniques: []
      };

      const errors = [];
      const warnings = [];

      // Validate recipes
      if (Array.isArray(data.recipes)) {
        data.recipes.forEach((recipe, index) => {
          try {
            const validation = validateRecipe(recipe);
            if (validation.isValid) {
              validatedData.recipes.push(createRecipe(recipe));
            } else {
              warnings.push(`Recipe ${index + 1}: ${validation.errors.join(', ')}`);
            }
          } catch {
            warnings.push(`Recipe ${index + 1}: Invalid format`);
          }
        });
      }

      // Validate ingredients
      if (Array.isArray(data.ingredients)) {
        data.ingredients.forEach((ingredient, index) => {
          try {
            const validation = validateIngredient(ingredient);
            if (validation.isValid) {
              validatedData.ingredients.push(createIngredient(ingredient));
            } else {
              warnings.push(`Ingredient ${index + 1}: ${validation.errors.join(', ')}`);
            }
          } catch {
            warnings.push(`Ingredient ${index + 1}: Invalid format`);
          }
        });
      }

      // Simple validation for other data types
      if (Array.isArray(data.savedMenus)) {
        validatedData.savedMenus = data.savedMenus.filter(menu => 
          menu && typeof menu === 'object' && menu.name
        );
      }

      if (Array.isArray(data.savedBatches)) {
        validatedData.savedBatches = data.savedBatches.filter(batch => 
          batch && typeof batch === 'object' && batch.name
        );
      }

      if (Array.isArray(data.techniques)) {
        validatedData.techniques = data.techniques.filter(technique => 
          technique && typeof technique === 'object' && technique.name
        );
      }

      return {
        isValid: true,
        errors,
        warnings,
        data: validatedData,
        summary: {
          recipesImported: validatedData.recipes.length,
          ingredientsImported: validatedData.ingredients.length,
          menusImported: validatedData.savedMenus.length,
          batchesImported: validatedData.savedBatches.length,
          techniquesImported: validatedData.techniques.length
        }
      };

    } catch {
      return {
        isValid: false,
        errors: ['Invalid JSON format'],
        data: null
      };
    }
  },

  /**
   * Validate and sanitize JSON data for import with detailed field-level error reporting
   * @param {string} jsonString - JSON string to validate
   * @param {Object} options - Validation options
   * @returns {Object} Detailed validation result with field-level errors
   */
  validateImportDataDetailed: (jsonString, options = {}) => {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      fieldErrors: [],
      data: null,
      summary: null,
      recoveryActions: [],
      validationReport: {
        totalFields: 0,
        validFields: 0,
        invalidFields: 0,
        skippedFields: 0
      }
    };

    try {
      // Basic length check
      if (jsonString.length > validationService.MAX_STRING_LENGTH) {
        result.isValid = false;
        result.errors.push('File content too large');
        result.recoveryActions.push({
          type: 'file_size',
          message: 'Reduce file size or split into smaller files',
          suggestion: `Maximum allowed size: ${Math.round(validationService.MAX_STRING_LENGTH / 1024 / 1024)}MB`
        });
        return result;
      }

      // Parse JSON with detailed error reporting
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (parseError) {
        result.isValid = false;
        const errorInfo = validationService._parseJsonError(parseError, jsonString);
        result.errors.push(errorInfo.message);
        result.fieldErrors.push({
          field: 'root',
          error: errorInfo.message,
          line: errorInfo.line,
          column: errorInfo.column,
          suggestion: errorInfo.suggestion
        });
        result.recoveryActions.push({
          type: 'json_syntax',
          message: 'Fix JSON syntax error',
          suggestion: errorInfo.suggestion,
          location: errorInfo.line ? `Line ${errorInfo.line}, Column ${errorInfo.column}` : 'Unknown'
        });
        return result;
      }

      // Validate root structure
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        result.isValid = false;
        result.errors.push('Root data must be an object');
        result.fieldErrors.push({
          field: 'root',
          error: `Expected object, got ${  Array.isArray(data) ? 'array' : typeof data}`,
          suggestion: 'Wrap your data in an object: { "recipes": [...], "ingredients": [...] }'
        });
        return result;
      }

      // Initialize validated data structure
      const validatedData = {
        recipes: [],
        ingredients: [],
        savedMenus: [],
        savedBatches: [],
        techniques: []
      };

      // Validate each section with detailed field-level reporting
      validationService._validateRecipesDetailed(data.recipes, validatedData, result, 'recipes');
      validationService._validateIngredientsDetailed(data.ingredients, validatedData, result, 'ingredients');
      validationService._validateMenusDetailed(data.savedMenus, validatedData, result, 'savedMenus');
      validationService._validateBatchesDetailed(data.savedBatches, validatedData, result, 'savedBatches');
      validationService._validateTechniquesDetailed(data.techniques, validatedData, result, 'techniques');

      // Set final data and summary
      result.data = validatedData;
      result.summary = {
        recipesImported: validatedData.recipes.length,
        ingredientsImported: validatedData.ingredients.length,
        menusImported: validatedData.savedMenus.length,
        batchesImported: validatedData.savedBatches.length,
        techniquesImported: validatedData.techniques.length
      };

      // Generate recovery actions for field errors
      if (result.fieldErrors.length > 0) {
        result.recoveryActions.push(...validationService._generateRecoveryActions(result.fieldErrors));
      }

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Unexpected validation error: ${  error.message}`);
      result.recoveryActions.push({
        type: 'general_error',
        message: 'Contact support if this error persists',
        suggestion: 'Try with a smaller or simpler data file'
      });
      return result;
    }
  },

  /**
   * Sanitize string input
   * @param {string} input - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString: (input) => {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, validationService.MAX_STRING_LENGTH)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  /**
   * Validate API key format (backward compatibility)
   * @param {string} service - Service name (gemini, openai)
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Is valid format
   */
  validateApiKeyFormat: (service, apiKey) => {
    const detailed = validationService.validateApiKeyDetailed(service, apiKey);
    return detailed.isValid;
  },

  /**
   * Detailed API key validation with comprehensive error reporting
   * @param {string} service - Service name (gemini, openai)
   * @param {string} apiKey - API key to validate
   * @param {Object} options - Validation options
   * @returns {Object} Detailed validation result
   */
  validateApiKeyDetailed: (service, apiKey, options = {}) => {
    const result = {
      isValid: false,
      errors: [],
      warnings: [],
      errorCode: null,
      source: 'manual',
      sourceDetails: {},
      recoveryAction: null,
      securityRecommendations: [
        'Store API keys in environment variables',
        'Never commit API keys to version control',
        'Rotate API keys regularly',
        'Use different keys for development and production'
      ]
    };

    // Handle null/undefined/empty keys
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      result.errors.push('API key is required');
      result.errorCode = 'MISSING_KEY';
      result.recoveryAction = validationService._getRecoveryAction(service, 'MISSING_KEY');
      return result;
    }

    // Trim whitespace and warn if necessary
    const trimmedKey = apiKey.trim();
    if (trimmedKey !== apiKey) {
      result.warnings.push('API key had leading/trailing whitespace (automatically trimmed)');
    }

    // Check for suspicious characters
    if (validationService._hasSuspiciousCharacters(trimmedKey)) {
      result.errors.push('API key contains invalid characters');
      result.errorCode = 'INVALID_CHARACTERS';
      return result;
    }

    // Check for placeholder keys first (before service validation)
    if (validationService._isPlaceholderKey(trimmedKey, service)) {
      const serviceName = service === 'gemini' ? 'Gemini' : service === 'openai' ? 'OpenAI' : service;
      result.errors.push(`This appears to be a placeholder API key. Please use your actual ${serviceName} API key.`);
      result.errorCode = 'PLACEHOLDER_KEY';
      result.recoveryAction = validationService._getRecoveryAction(service, 'PLACEHOLDER_KEY');
      return result;
    }

    // Service-specific validation
    const serviceValidation = validationService._validateServiceSpecificKey(service, trimmedKey);
    result.errors.push(...serviceValidation.errors);
    result.warnings.push(...serviceValidation.warnings);
    if (serviceValidation.errorCode) {
      result.errorCode = serviceValidation.errorCode;
    }

    // Check source (environment vs manual)
    const sourceInfo = validationService._getApiKeySource(service, trimmedKey);
    result.source = sourceInfo.source;
    result.sourceDetails = sourceInfo.details;
    if (sourceInfo.warnings) {
      result.warnings.push(...sourceInfo.warnings);
    }

    // Security context warnings
    if (options.context === 'url_parameter') {
      result.warnings.push('API key detected in URL parameter - this is a security risk');
    }

    // Set recovery action if there are errors
    if (result.errors.length > 0 && !result.recoveryAction) {
      result.recoveryAction = validationService._getRecoveryAction(service, result.errorCode);
    }

    // Final validation result
    result.isValid = result.errors.length === 0;

    return result;
  },

  /**
   * Get validation recommendations
   * @returns {Array} Array of recommendations
   */
  getRecommendations: () => {
    const recommendations = [];
    const envValidation = validationService.validateEnvironment();

    if (!envValidation.gemini.isConfigured) {
      recommendations.push({
        type: 'warning',
        title: 'AI Features Disabled',
        message: 'Configure Gemini API key to enable AI-powered recipe suggestions and PDF processing',
        action: 'Add VITE_GEMINI_API_KEY to your environment variables'
      });
    }

    if (!envValidation.supabase.isConfigured) {
      recommendations.push({
        type: 'info',
        title: 'Cloud Sync Disabled',
        message: 'Configure Supabase to enable cloud sync and multi-device access',
        action: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables'
      });
    }

    return recommendations;
  },

  // =========================================================================
  // PRIVATE HELPER FUNCTIONS FOR ENHANCED API KEY VALIDATION
  // =========================================================================

  /**
   * Check if API key contains suspicious characters
   * @private
   */
  _hasSuspiciousCharacters: (apiKey) => {
    // Check for HTML/script tags, SQL injection patterns, etc.
    const suspiciousPatterns = [
      /<script/i,
      /<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\bdrop\s+table\b/i,
      /\bunion\s+select\b/i,
      /[<>'"&]/
    ];

    return suspiciousPatterns.some(pattern => pattern.test(apiKey));
  },

  /**
   * Check if API key is a placeholder
   * @private
   */
  _isPlaceholderKey: (apiKey, service) => {
    const lowerKey = apiKey.toLowerCase();

    // Exact placeholder matches (most reliable)
    const exactPlaceholders = [
      'your_api_key_here',
      'insert_key_here',
      'your_key_here',
      'api_key_here',
      'replace_this_key',
      'example_api_key',
      'put_key_here',
      'your_gemini_api_key_here',
      'insert_gemini_key_here',
      'your_openai_api_key_here',
      'sk-your_openai_api_key_here',
      '_your_api_key_here_',
      'insert_gemini_key_here',
      'aiza_your_api_key_here',
      'aizayour_api_key_here'
    ];

    // Check for exact matches in the key
    for (const placeholder of exactPlaceholders) {
      if (lowerKey.includes(placeholder)) {
        return true;
      }
    }

    // Check for common placeholder patterns
    const placeholderPatterns = [
      /your_.*_api_key_here/,
      /insert_.*_key_here/,
      /_your_api_key_here_/,
      /aiza.*your.*api.*key.*here/,
      /sk-.*your.*api.*key.*here/
    ];

    if (placeholderPatterns.some(pattern => pattern.test(lowerKey))) {
      return true;
    }

    // Service-specific placeholder patterns
    if (service === 'gemini') {
      const geminiPlaceholders = [
        'aiza_your_api_key_here',
        'aiza_insert_key_here',
        'aizayour_api_key_here'
      ];
      for (const placeholder of geminiPlaceholders) {
        if (lowerKey.includes(placeholder)) {
          return true;
        }
      }
    }

    if (service === 'openai') {
      const openaiPlaceholders = [
        'sk-your_api_key_here',
        'sk-insert_key_here',
        'sk-your_openai_api_key'
      ];
      for (const placeholder of openaiPlaceholders) {
        if (lowerKey.includes(placeholder)) {
          return true;
        }
      }
    }

    // Only check for very obvious placeholder patterns to avoid false positives
    const obviousPlaceholderPatterns = [
      /^your_.*_api_key_here$/,
      /^insert_.*_key_here$/,
      /^replace_.*_with_.*_key$/,
      /^example_.*_api_key$/
    ];

    return obviousPlaceholderPatterns.some(pattern => pattern.test(lowerKey));
  },

  /**
   * Get API key source information
   * @private
   */
  _getApiKeySource: (service, apiKey) => {
    const envVarMap = {
      'gemini': 'VITE_GEMINI_API_KEY',
      'openai': 'VITE_OPENAI_API_KEY'
    };

    const envVar = envVarMap[service];
    const envValue = envVar ? import.meta.env[envVar] : null;

    if (envValue && envValue === apiKey) {
      return {
        source: 'environment',
        details: {
          variable: envVar,
          isSecure: true
        },
        warnings: []
      };
    }

    if (envValue && envValue !== apiKey) {
      return {
        source: 'environment',
        details: {
          variable: envVar,
          isSecure: true
        },
        warnings: ['Environment variable takes precedence over manually entered key']
      };
    }

    return {
      source: 'manual',
      details: {
        isSecure: false,
        recommendation: 'Consider using environment variables for better security'
      },
      warnings: []
    };
  },

  /**
   * Validate service-specific API key requirements
   * @private
   */
  _validateServiceSpecificKey: (service, apiKey) => {
    const result = {
      errors: [],
      warnings: [],
      errorCode: null
    };

    switch (service) {
      case 'gemini':
        if (!apiKey.startsWith('AIza')) {
          result.errors.push('Gemini API keys must start with "AIza"');
          result.errorCode = 'INVALID_PREFIX';
        } else if (apiKey.length < 30) {
          result.errors.push('Gemini API keys must be at least 30 characters long');
          result.errorCode = 'INVALID_LENGTH';
        }
        break;

      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          result.errors.push('OpenAI API keys must start with "sk-"');
          result.errorCode = 'INVALID_PREFIX';
        } else if (apiKey.length < 40) {
          result.errors.push('OpenAI API keys must be at least 40 characters long');
          result.errorCode = 'INVALID_LENGTH';
        }
        break;

      default:
        if (apiKey.length < 10) {
          result.errors.push(`API key for ${service} must be at least 10 characters long`);
          result.errorCode = 'INVALID_LENGTH';
        } else {
          result.warnings.push('Unknown service type - using generic validation');
        }
        break;
    }

    return result;
  },

  /**
   * Get recovery action for API key errors
   * @private
   */
  _getRecoveryAction: (service, errorCode) => {
    const actions = {
      'gemini': {
        'MISSING_KEY': {
          type: 'open_settings',
          message: 'Open Settings to configure your Gemini API key',
          url: 'https://makersuite.google.com/app/apikey'
        },
        'INVALID_PREFIX': {
          type: 'open_settings',
          message: 'Open Settings to configure your Gemini API key',
          url: 'https://makersuite.google.com/app/apikey'
        },
        'INVALID_LENGTH': {
          type: 'open_settings',
          message: 'Open Settings to configure your Gemini API key',
          url: 'https://makersuite.google.com/app/apikey'
        },
        'PLACEHOLDER_KEY': {
          type: 'open_settings',
          message: 'Replace the placeholder with your actual Gemini API key',
          url: 'https://makersuite.google.com/app/apikey'
        }
      },
      'openai': {
        'MISSING_KEY': {
          type: 'open_settings',
          message: 'Open Settings to configure your OpenAI API key',
          url: 'https://platform.openai.com/api-keys'
        },
        'INVALID_PREFIX': {
          type: 'open_settings',
          message: 'Open Settings to enter a valid OpenAI API key',
          url: 'https://platform.openai.com/api-keys'
        },
        'PLACEHOLDER_KEY': {
          type: 'open_settings',
          message: 'Replace the placeholder with your actual OpenAI API key',
          url: 'https://platform.openai.com/api-keys'
        }
      }
    };

    return actions[service]?.[errorCode] || {
      type: 'open_settings',
      message: 'Open Settings to configure your API key',
      url: null
    };
  },

  // =========================================================================
  // PRIVATE HELPER FUNCTIONS FOR DETAILED IMPORT VALIDATION
  // =========================================================================

  /**
   * Parse JSON error to extract line/column information
   * @private
   */
  _parseJsonError: (error, jsonString) => {
    const message = error.message || 'Invalid JSON format';
    let line = null;
    let column = null;
    let suggestion = 'Check JSON syntax';

    // Try to extract line/column from error message
    const lineMatch = message.match(/line (\d+)/i);
    const columnMatch = message.match(/column (\d+)/i);
    const positionMatch = message.match(/position (\d+)/i);

    if (lineMatch) {
      line = parseInt(lineMatch[1]);
    }
    if (columnMatch) {
      column = parseInt(columnMatch[1]);
    }
    if (positionMatch && !line) {
      const position = parseInt(positionMatch[1]);
      const lines = jsonString.substring(0, position).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    // Provide specific suggestions based on error type
    if (message.includes('Unexpected token')) {
      suggestion = 'Check for missing commas, quotes, or brackets';
    } else if (message.includes('Unexpected end')) {
      suggestion = 'Check for missing closing brackets or braces';
    } else if (message.includes('Unexpected string')) {
      suggestion = 'Check for missing commas between properties';
    }

    return {
      message: `JSON Parse Error: ${message}`,
      line,
      column,
      suggestion
    };
  },

  /**
   * Validate recipes array with detailed field-level reporting
   * @private
   */
  _validateRecipesDetailed: (recipes, validatedData, result, fieldPath) => {
    if (!recipes) return;

    if (!Array.isArray(recipes)) {
      result.fieldErrors.push({
        field: fieldPath,
        error: `Expected array, got ${typeof recipes}`,
        suggestion: 'Recipes should be an array: "recipes": [...]'
      });
      result.validationReport.invalidFields++;
      return;
    }

    recipes.forEach((recipe, index) => {
      const recipePath = `${fieldPath}[${index}]`;
      result.validationReport.totalFields++;

      try {
        if (!recipe || typeof recipe !== 'object') {
          result.fieldErrors.push({
            field: recipePath,
            error: `Expected object, got ${typeof recipe}`,
            suggestion: 'Each recipe should be an object with name, ingredients, etc.'
          });
          result.validationReport.invalidFields++;
          return;
        }

        const validation = validateRecipe(recipe);
        if (validation.isValid) {
          validatedData.recipes.push(createRecipe(recipe));
          result.validationReport.validFields++;
        } else {
          validation.errors.forEach(error => {
            result.fieldErrors.push({
              field: recipePath,
              error,
              suggestion: validationService._getRecipeSuggestion(error)
            });
          });
          result.warnings.push(`Recipe ${index + 1}: ${validation.errors.join(', ')}`);
          result.validationReport.invalidFields++;
        }
      } catch (error) {
        result.fieldErrors.push({
          field: recipePath,
          error: `Invalid recipe format: ${  error.message}`,
          suggestion: 'Check recipe structure and required fields'
        });
        result.warnings.push(`Recipe ${index + 1}: Invalid format`);
        result.validationReport.invalidFields++;
      }
    });
  },

  /**
   * Validate ingredients array with detailed field-level reporting
   * @private
   */
  _validateIngredientsDetailed: (ingredients, validatedData, result, fieldPath) => {
    if (!ingredients) return;

    if (!Array.isArray(ingredients)) {
      result.fieldErrors.push({
        field: fieldPath,
        error: `Expected array, got ${typeof ingredients}`,
        suggestion: 'Ingredients should be an array: "ingredients": [...]'
      });
      result.validationReport.invalidFields++;
      return;
    }

    ingredients.forEach((ingredient, index) => {
      const ingredientPath = `${fieldPath}[${index}]`;
      result.validationReport.totalFields++;

      try {
        if (!ingredient || typeof ingredient !== 'object') {
          result.fieldErrors.push({
            field: ingredientPath,
            error: `Expected object, got ${typeof ingredient}`,
            suggestion: 'Each ingredient should be an object with name, category, etc.'
          });
          result.validationReport.invalidFields++;
          return;
        }

        const validation = validateIngredient(ingredient);
        if (validation.isValid) {
          validatedData.ingredients.push(createIngredient(ingredient));
          result.validationReport.validFields++;
        } else {
          validation.errors.forEach(error => {
            result.fieldErrors.push({
              field: ingredientPath,
              error,
              suggestion: validationService._getIngredientSuggestion(error)
            });
          });
          result.warnings.push(`Ingredient ${index + 1}: ${validation.errors.join(', ')}`);
          result.validationReport.invalidFields++;
        }
      } catch (error) {
        result.fieldErrors.push({
          field: ingredientPath,
          error: `Invalid ingredient format: ${  error.message}`,
          suggestion: 'Check ingredient structure and required fields'
        });
        result.warnings.push(`Ingredient ${index + 1}: Invalid format`);
        result.validationReport.invalidFields++;
      }
    });
  },

  /**
   * Validate menus array with detailed field-level reporting
   * @private
   */
  _validateMenusDetailed: (menus, validatedData, result, fieldPath) => {
    if (!menus) return;

    if (!Array.isArray(menus)) {
      result.fieldErrors.push({
        field: fieldPath,
        error: `Expected array, got ${typeof menus}`,
        suggestion: 'Saved menus should be an array: "savedMenus": [...]'
      });
      result.validationReport.invalidFields++;
      return;
    }

    menus.forEach((menu, index) => {
      const menuPath = `${fieldPath}[${index}]`;
      result.validationReport.totalFields++;

      if (!menu || typeof menu !== 'object') {
        result.fieldErrors.push({
          field: menuPath,
          error: `Expected object, got ${typeof menu}`,
          suggestion: 'Each menu should be an object with name and items'
        });
        result.validationReport.invalidFields++;
        return;
      }

      if (!menu.name) {
        result.fieldErrors.push({
          field: `${menuPath}.name`,
          error: 'Menu name is required',
          suggestion: 'Add a name property: "name": "Menu Name"'
        });
        result.validationReport.invalidFields++;
        return;
      }

      validatedData.savedMenus.push(menu);
      result.validationReport.validFields++;
    });
  },

  /**
   * Validate batches array with detailed field-level reporting
   * @private
   */
  _validateBatchesDetailed: (batches, validatedData, result, fieldPath) => {
    if (!batches) return;

    if (!Array.isArray(batches)) {
      result.fieldErrors.push({
        field: fieldPath,
        error: `Expected array, got ${typeof batches}`,
        suggestion: 'Saved batches should be an array: "savedBatches": [...]'
      });
      result.validationReport.invalidFields++;
      return;
    }

    batches.forEach((batch, index) => {
      const batchPath = `${fieldPath}[${index}]`;
      result.validationReport.totalFields++;

      if (!batch || typeof batch !== 'object') {
        result.fieldErrors.push({
          field: batchPath,
          error: `Expected object, got ${typeof batch}`,
          suggestion: 'Each batch should be an object with name and recipes'
        });
        result.validationReport.invalidFields++;
        return;
      }

      if (!batch.name) {
        result.fieldErrors.push({
          field: `${batchPath}.name`,
          error: 'Batch name is required',
          suggestion: 'Add a name property: "name": "Batch Name"'
        });
        result.validationReport.invalidFields++;
        return;
      }

      validatedData.savedBatches.push(batch);
      result.validationReport.validFields++;
    });
  },

  /**
   * Validate techniques array with detailed field-level reporting
   * @private
   */
  _validateTechniquesDetailed: (techniques, validatedData, result, fieldPath) => {
    if (!techniques) return;

    if (!Array.isArray(techniques)) {
      result.fieldErrors.push({
        field: fieldPath,
        error: `Expected array, got ${typeof techniques}`,
        suggestion: 'Techniques should be an array: "techniques": [...]'
      });
      result.validationReport.invalidFields++;
      return;
    }

    techniques.forEach((technique, index) => {
      const techniquePath = `${fieldPath}[${index}]`;
      result.validationReport.totalFields++;

      if (!technique || typeof technique !== 'object') {
        result.fieldErrors.push({
          field: techniquePath,
          error: `Expected object, got ${typeof technique}`,
          suggestion: 'Each technique should be an object with name and description'
        });
        result.validationReport.invalidFields++;
        return;
      }

      if (!technique.name) {
        result.fieldErrors.push({
          field: `${techniquePath}.name`,
          error: 'Technique name is required',
          suggestion: 'Add a name property: "name": "Technique Name"'
        });
        result.validationReport.invalidFields++;
        return;
      }

      validatedData.techniques.push(technique);
      result.validationReport.validFields++;
    });
  },

  /**
   * Generate recovery actions based on field errors
   * @private
   */
  _generateRecoveryActions: (fieldErrors) => {
    const actions = [];
    const errorTypes = new Set();

    fieldErrors.forEach(error => {
      if (error.field.includes('recipes') && !errorTypes.has('recipes')) {
        actions.push({
          type: 'recipe_validation',
          message: 'Fix recipe validation errors',
          suggestion: 'Ensure all recipes have required fields: name, ingredients, instructions'
        });
        errorTypes.add('recipes');
      }

      if (error.field.includes('ingredients') && !errorTypes.has('ingredients')) {
        actions.push({
          type: 'ingredient_validation',
          message: 'Fix ingredient validation errors',
          suggestion: 'Ensure all ingredients have required fields: name, category'
        });
        errorTypes.add('ingredients');
      }

      if (error.error.includes('Expected array') && !errorTypes.has('array_structure')) {
        actions.push({
          type: 'array_structure',
          message: 'Fix data structure errors',
          suggestion: 'Ensure recipes, ingredients, etc. are arrays: "recipes": [...]'
        });
        errorTypes.add('array_structure');
      }
    });

    return actions;
  },

  /**
   * Get suggestion for recipe validation error
   * @private
   */
  _getRecipeSuggestion: (error) => {
    if (error.includes('name')) {
      return 'Add a recipe name: "name": "Recipe Name"';
    }
    if (error.includes('ingredients')) {
      return 'Add ingredients array: "ingredients": [{"name": "...", "amount": "...", "unit": "..."}]';
    }
    if (error.includes('instructions')) {
      return 'Add instructions: "instructions": "Step by step instructions"';
    }
    return 'Check recipe structure and required fields';
  },

  /**
   * Get suggestion for ingredient validation error
   * @private
   */
  _getIngredientSuggestion: (error) => {
    if (error.includes('name')) {
      return 'Add an ingredient name: "name": "Ingredient Name"';
    }
    if (error.includes('category')) {
      return 'Add a category: "category": "Liquor" or "Mixers", etc.';
    }
    if (error.includes('price')) {
      return 'Add a valid price: "price": 12.50';
    }
    return 'Check ingredient structure and required fields';
  },

  // Security scoring and recommendations system
  getSecurityScore: (config = {}) => {
    const {
      apiKeys = {},
      environment = 'development',
      storageMethod = 'localStorage',
      encryptionEnabled = false,
      httpsEnabled = true,
      corsEnabled = false,
      debugMode = false,
      logLevel = 'info'
    } = config;

    let score = 100;
    const issues = [];
    const recommendations = [];
    const strengths = [];

    // API Key Security Assessment (40 points)
    const apiKeyAssessment = validationService._assessApiKeySecurity(apiKeys);
    score -= apiKeyAssessment.deductions;
    issues.push(...apiKeyAssessment.issues);
    recommendations.push(...apiKeyAssessment.recommendations);
    strengths.push(...apiKeyAssessment.strengths);

    // Environment Security Assessment (20 points)
    const envAssessment = validationService._assessEnvironmentSecurity(environment, debugMode, logLevel);
    score -= envAssessment.deductions;
    issues.push(...envAssessment.issues);
    recommendations.push(...envAssessment.recommendations);
    strengths.push(...envAssessment.strengths);

    // Storage Security Assessment (20 points)
    const storageAssessment = validationService._assessStorageSecurity(storageMethod, encryptionEnabled);
    score -= storageAssessment.deductions;
    issues.push(...storageAssessment.issues);
    recommendations.push(...storageAssessment.recommendations);
    strengths.push(...storageAssessment.strengths);

    // Network Security Assessment (20 points)
    const networkAssessment = validationService._assessNetworkSecurity(httpsEnabled, corsEnabled);
    score -= networkAssessment.deductions;
    issues.push(...networkAssessment.issues);
    recommendations.push(...networkAssessment.recommendations);
    strengths.push(...networkAssessment.strengths);

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    // Determine security level
    let securityLevel = 'critical';
    if (score >= 90) securityLevel = 'excellent';
    else if (score >= 80) securityLevel = 'good';
    else if (score >= 70) securityLevel = 'fair';
    else if (score >= 60) securityLevel = 'poor';

    return {
      score,
      securityLevel,
      issues: issues.sort((a, b) => b.severity - a.severity),
      recommendations: recommendations.sort((a, b) => b.priority - a.priority),
      strengths,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(i => i.severity >= 8).length,
        highIssues: issues.filter(i => i.severity >= 6 && i.severity < 8).length,
        mediumIssues: issues.filter(i => i.severity >= 4 && i.severity < 6).length,
        lowIssues: issues.filter(i => i.severity < 4).length,
        totalRecommendations: recommendations.length,
        highPriorityRecommendations: recommendations.filter(r => r.priority >= 8).length
      },
      timestamp: new Date().toISOString()
    };
  },

  // Private helper methods for security assessment
  _assessApiKeySecurity: (apiKeys) => {
    const assessment = {
      deductions: 0,
      issues: [],
      recommendations: [],
      strengths: []
    };

    const keyCount = Object.keys(apiKeys).length;

    if (keyCount === 0) {
      assessment.deductions += 10;
      assessment.issues.push({
        type: 'missing_api_keys',
        severity: 6,
        message: 'No API keys configured',
        description: 'Application may not function properly without API keys'
      });
      assessment.recommendations.push({
        type: 'configure_api_keys',
        priority: 8,
        message: 'Configure required API keys',
        description: 'Set up API keys for services like Gemini AI',
        action: 'Add API keys in environment variables or settings'
      });
    } else {
      assessment.strengths.push('API keys are configured');
    }

    // Check each API key
    Object.entries(apiKeys).forEach(([service, key]) => {
      if (!key || key.trim() === '') {
        assessment.deductions += 5;
        assessment.issues.push({
          type: 'empty_api_key',
          severity: 7,
          message: `Empty API key for ${service}`,
          description: `${service} service will not function without a valid API key`
        });
        return;
      }

      // Check for placeholder keys
      const placeholderPatterns = [
        /your[_-]?api[_-]?key[_-]?here/i,
        /replace[_-]?with[_-]?your[_-]?key/i,
        /dummy[_-]?key/i,
        /test[_-]?key/i,
        /example[_-]?key/i,
        /placeholder/i
      ];

      const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(key));
      if (isPlaceholder) {
        assessment.deductions += 8;
        assessment.issues.push({
          type: 'placeholder_api_key',
          severity: 8,
          message: `Placeholder API key detected for ${service}`,
          description: 'Using placeholder keys in production is a security risk'
        });
        assessment.recommendations.push({
          type: 'replace_placeholder',
          priority: 9,
          message: `Replace placeholder key for ${service}`,
          description: 'Use a real API key from the service provider',
          action: `Get a valid API key from ${service} and update configuration`
        });
      }

      // Check key format and length
      const detailed = validationService.validateApiKeyDetailed(service, key);
      if (!detailed.isValid) {
        assessment.deductions += 6;
        assessment.issues.push({
          type: 'invalid_api_key_format',
          severity: 7,
          message: `Invalid API key format for ${service}`,
          description: detailed.error || 'API key does not match expected format'
        });
      } else {
        assessment.strengths.push(`Valid ${service} API key format`);
      }

      // Check if key is stored in environment variables (security best practice)
      const envKey = process.env[`${service.toUpperCase()}_API_KEY`] ||
                     process.env[`VITE_${service.toUpperCase()}_API_KEY`];
      if (!envKey) {
        assessment.deductions += 3;
        assessment.issues.push({
          type: 'api_key_not_in_env',
          severity: 5,
          message: `${service} API key not in environment variables`,
          description: 'Storing API keys in code or localStorage is less secure'
        });
        assessment.recommendations.push({
          type: 'use_environment_variables',
          priority: 7,
          message: `Store ${service} API key in environment variables`,
          description: 'Use .env file or system environment variables',
          action: `Set ${service.toUpperCase()}_API_KEY in environment`
        });
      } else {
        assessment.strengths.push(`${service} API key stored in environment variables`);
      }
    });

    return assessment;
  },

  _assessEnvironmentSecurity: (environment, debugMode, logLevel) => {
    const assessment = {
      deductions: 0,
      issues: [],
      recommendations: [],
      strengths: []
    };

    // Production environment checks
    if (environment === 'production') {
      assessment.strengths.push('Running in production environment');

      if (debugMode) {
        assessment.deductions += 8;
        assessment.issues.push({
          type: 'debug_mode_in_production',
          severity: 8,
          message: 'Debug mode enabled in production',
          description: 'Debug mode can expose sensitive information'
        });
        assessment.recommendations.push({
          type: 'disable_debug_mode',
          priority: 9,
          message: 'Disable debug mode in production',
          description: 'Set DEBUG=false or NODE_ENV=production',
          action: 'Update environment configuration'
        });
      }

      if (logLevel === 'debug' || logLevel === 'trace') {
        assessment.deductions += 5;
        assessment.issues.push({
          type: 'verbose_logging_in_production',
          severity: 6,
          message: 'Verbose logging enabled in production',
          description: 'Detailed logs may contain sensitive information'
        });
        assessment.recommendations.push({
          type: 'reduce_log_level',
          priority: 7,
          message: 'Use appropriate log level for production',
          description: 'Set log level to "warn" or "error" in production',
          action: 'Update logging configuration'
        });
      }
    } else {
      // Development environment
      if (environment === 'development') {
        assessment.strengths.push('Development environment properly configured');
      } else {
        assessment.deductions += 3;
        assessment.issues.push({
          type: 'unknown_environment',
          severity: 4,
          message: `Unknown environment: ${environment}`,
          description: 'Environment should be clearly defined as development, staging, or production'
        });
      }
    }

    return assessment;
  },

  _assessStorageSecurity: (storageMethod, encryptionEnabled) => {
    const assessment = {
      deductions: 0,
      issues: [],
      recommendations: [],
      strengths: []
    };

    if (storageMethod === 'localStorage') {
      if (!encryptionEnabled) {
        assessment.deductions += 6;
        assessment.issues.push({
          type: 'unencrypted_local_storage',
          severity: 6,
          message: 'Data stored in localStorage without encryption',
          description: 'Sensitive data in localStorage can be accessed by malicious scripts'
        });
        assessment.recommendations.push({
          type: 'enable_encryption',
          priority: 7,
          message: 'Enable encryption for local storage',
          description: 'Encrypt sensitive data before storing locally',
          action: 'Implement client-side encryption for stored data'
        });
      } else {
        assessment.strengths.push('Local storage data is encrypted');
      }
    } else if (storageMethod === 'sessionStorage') {
      assessment.strengths.push('Using session storage (better than localStorage)');
      if (!encryptionEnabled) {
        assessment.deductions += 4;
        assessment.issues.push({
          type: 'unencrypted_session_storage',
          severity: 5,
          message: 'Data stored in sessionStorage without encryption',
          description: 'Consider encrypting sensitive session data'
        });
      }
    } else if (storageMethod === 'indexedDB') {
      assessment.strengths.push('Using IndexedDB for data storage');
      if (!encryptionEnabled) {
        assessment.deductions += 3;
        assessment.issues.push({
          type: 'unencrypted_indexeddb',
          severity: 4,
          message: 'IndexedDB data not encrypted',
          description: 'Consider encrypting sensitive data in IndexedDB'
        });
      }
    } else if (storageMethod === 'cloud') {
      assessment.strengths.push('Using cloud storage (most secure option)');
    } else {
      assessment.deductions += 5;
      assessment.issues.push({
        type: 'unknown_storage_method',
        severity: 5,
        message: `Unknown storage method: ${storageMethod}`,
        description: 'Storage method should be clearly defined and secure'
      });
    }

    return assessment;
  },

  _assessNetworkSecurity: (httpsEnabled, corsEnabled) => {
    const assessment = {
      deductions: 0,
      issues: [],
      recommendations: [],
      strengths: []
    };

    if (!httpsEnabled) {
      assessment.deductions += 10;
      assessment.issues.push({
        type: 'https_not_enabled',
        severity: 9,
        message: 'HTTPS not enabled',
        description: 'Data transmitted over HTTP is not encrypted and can be intercepted'
      });
      assessment.recommendations.push({
        type: 'enable_https',
        priority: 10,
        message: 'Enable HTTPS for all communications',
        description: 'Use SSL/TLS certificates to encrypt data in transit',
        action: 'Configure HTTPS on your web server'
      });
    } else {
      assessment.strengths.push('HTTPS enabled for secure communication');
    }

    if (corsEnabled) {
      assessment.deductions += 3;
      assessment.issues.push({
        type: 'cors_enabled',
        severity: 4,
        message: 'CORS is enabled',
        description: 'Ensure CORS is properly configured to prevent unauthorized access'
      });
      assessment.recommendations.push({
        type: 'review_cors_config',
        priority: 6,
        message: 'Review CORS configuration',
        description: 'Ensure CORS allows only trusted domains',
        action: 'Configure CORS with specific allowed origins'
      });
    } else {
      assessment.strengths.push('CORS properly configured');
    }

    return assessment;
  }
};

export default validationService;
