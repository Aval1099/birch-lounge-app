// =============================================================================
// GEMINI AI SERVICE
// =============================================================================

import { apiKeyService } from './apiKeyService';
import { errorHandler } from './errorHandler';

/**
 * Service for interacting with Google's Gemini AI API
 */
export const geminiService = {
  /**
   * Generate content using Gemini AI
   * @param {string} apiKey - Gemini API key
   * @param {string} userPrompt - User prompt for AI
   * @param {boolean} isJson - Whether to expect JSON response
   * @param {number} retries - Number of retry attempts
   * @param {number} initialDelay - Initial delay for retries
   * @returns {Promise<string|Object>} AI response
   */
  generate: async (
    providedApiKey,
    userPrompt,
    isJson = false,
    retries = 3,
    initialDelay = 1000
  ) => {
    try {
      // Get API key securely if not provided
      const apiKey = providedApiKey || apiKeyService.getApiKey('gemini');
      
      // Validate API key
      if (!apiKey || !apiKeyService._validateApiKeyFormat('gemini', apiKey)) {
        throw new Error('Invalid or missing Gemini API key');
      }

      if (!userPrompt || typeof userPrompt !== 'string') {
        throw new Error('Valid user prompt is required');
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
      };

      if (isJson) {
        payload.generationConfig = {
          responseMimeType: "application/json",
        };
      }

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          let response;
          try {
            response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'BirchLounge/1.0'
              },
              body: JSON.stringify(payload),
              signal: controller.signal
            });
            
            // Clear timeout on successful response
            clearTimeout(timeoutId);

          } catch (fetchError) {
            // Clear timeout on fetch error
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
              throw new Error('Request timeout: The API request took too long to complete (30 seconds)');
            }
            throw fetchError;
          }

          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const errorMessage = errorBody?.error?.message || 'Unknown error';
            throw new Error(
              `API Error: ${response.status} ${response.statusText} - ${errorMessage}`
            );
          }
          
          const result = await response.json();
          
          const candidate = result.candidates?.[0];
          if (!candidate || !candidate.content?.parts?.[0]?.text) {
            throw new Error('Invalid response structure from API');
          }
          
          const text = candidate.content.parts[0].text;
          
          if (isJson) {
            try {
              const jsonString = text
                .trim()
                .replace(/^```json\s*/, '')
                .replace(/```$/, '');
              return JSON.parse(jsonString);
            } catch {
              console.error("Failed to parse JSON response:", text);
              throw new Error("AI returned invalid JSON format");
            }
          }
          
          return text;

        } catch (error) {
          console.error(`Gemini API attempt ${attempt + 1} failed:`, error);
          
          if (attempt === retries - 1) {
            // Handle error with simplified error handler
            const handled = errorHandler.handle(error, 'Gemini API');
            throw new Error(handled.userMessage);
          }
          
          // Exponential backoff
          const delay = initialDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      // Handle top-level errors
      const handled = errorHandler.handle(error, 'Gemini API');
      throw new Error(handled.userMessage);
    }
  },

  /**
   * Test API key validity with a simple request
   * @param {string} apiKey - API key to test
   * @returns {Promise<boolean>} True if API key is valid
   */
  testApiKey: async (apiKey) => {
    if (!apiKey) {
      throw new Error('API key is required for testing');
    }

    try {
      // Test with a simple, minimal request
      const testPrompt = 'Hello';
      await geminiService.generate(apiKey, testPrompt, false, 1, 1000);
      return true;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  },

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Is valid format
   */
  validateApiKey: (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Use the API key service for validation
    try {
      return apiKeyService._validateApiKeyFormat('gemini', apiKey);
    } catch {
      return false;
    }
  },

  /**
   * Get usage statistics (placeholder for future implementation)
   * @param {string} apiKey - API key
   * @returns {Promise<Object>} Usage stats
   */
  getUsageStats: async () => {
    // Placeholder for future implementation
    return {
      requestsToday: 0,
      tokensUsed: 0,
      remainingQuota: 'Unknown'
    };
  },

  /**
   * Check if API key is configured and available
   * @returns {boolean} True if API key is available
   */
  isConfigured: () => {
    return apiKeyService.hasApiKey('gemini');
  },

  /**
   * Get the current API key source information
   * @returns {Object} Source information
   */
  getKeySource: () => {
    const envKey = apiKeyService._getEnvironmentKey('gemini');
    const hasMemoryKey = apiKeyService._apiKeyStore.has('gemini');
    
    return {
      source: envKey ? 'environment' : (hasMemoryKey ? 'memory' : 'none'),
      hasEnvironmentKey: Boolean(envKey),
      hasMemoryKey,
      isConfigured: Boolean(envKey || hasMemoryKey)
    };
  }
};
