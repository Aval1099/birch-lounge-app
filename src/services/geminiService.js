// =============================================================================
// GEMINI AI SERVICE
// =============================================================================

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
    apiKey, 
    userPrompt, 
    isJson = false, 
    retries = 3, 
    initialDelay = 1000
  ) => {
    if (!apiKey) {
      throw new Error('API key is required');
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
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'BirchLounge/1.0'
          },
          body: JSON.stringify(payload)
        });

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
          throw error;
        }
        
        // Exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  /**
   * Validate API key format
   * @param {string} apiKey - API key to validate
   * @returns {boolean} Is valid format
   */
  validateApiKey: (apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') return false;
    // Basic validation - Gemini keys typically start with 'AIza'
    return apiKey.length > 20 && apiKey.startsWith('AIza');
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
  }
};
