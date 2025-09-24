/**
 * MCP Search Service for Real-time Recipe Discovery
 * Integrates with Exa Search MCP for intelligent cocktail and ingredient search
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { apiKeyService } from './apiKeyService.js';

class MCPSearchService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize MCP Search connection
   */
  async initialize() {
    try {
      const exaApiKey = apiKeyService.getApiKey('exa') || process.env.VITE_EXA_API_KEY;

      if (!exaApiKey) {
        throw new Error('Exa API key not found. Please configure in settings.');
      }

      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@exa-labs/exa-mcp-server'],
        env: {
          ...process.env,
          EXA_API_KEY: exaApiKey
        }
      });

      this.client = new Client({
        name: 'birch-lounge-search',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      console.warn('MCP Search Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP Search Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Search for cocktail recipes
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Search results
   */
  async searchRecipes(query, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    const cacheKey = `recipes:${query}:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const searchQuery = this.buildRecipeSearchQuery(query, options);

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: {
            query: searchQuery,
            num_results: options.limit || 10,
            include_domains: [
              'liquor.com',
              'diffordsguide.com',
              'punchdrink.com',
              'imbibemagazine.com',
              'cocktaildb.com'
            ],
            use_autoprompt: true,
            type: 'neural'
          }
        }
      });

      const results = this.processRecipeSearchResults(response.results || []);
      this.setCache(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Recipe search error:', error);
      throw error;
    }
  }

  /**
   * Search for ingredient information and substitutes
   * @param {string} ingredient - Ingredient name
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Ingredient information and substitutes
   */
  async searchIngredientInfo(ingredient, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    const cacheKey = `ingredient:${ingredient}:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Search for ingredient information
      const infoQuery = `${ingredient} cocktail ingredient information substitutes alternatives`;

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: {
            query: infoQuery,
            num_results: 5,
            include_domains: [
              'liquor.com',
              'diffordsguide.com',
              'thespruceeats.com',
              'masterclass.com'
            ],
            use_autoprompt: true
          }
        }
      });

      const ingredientInfo = this.processIngredientSearchResults(response.results || [], ingredient);
      this.setCache(cacheKey, ingredientInfo);

      return ingredientInfo;
    } catch (error) {
      console.error('Ingredient search error:', error);
      throw error;
    }
  }

  /**
   * Search for trending cocktails
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Trending cocktail results
   */
  async searchTrendingCocktails(options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    const cacheKey = `trending:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const currentYear = new Date().getFullYear();
      const season = this.getCurrentSeason();

      const trendingQuery = `trending cocktails ${currentYear} ${season} popular drinks bartender recommendations`;

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: {
            query: trendingQuery,
            num_results: options.limit || 15,
            include_domains: [
              'punchdrink.com',
              'imbibemagazine.com',
              'liquor.com',
              'foodandwine.com'
            ],
            use_autoprompt: true,
            start_published_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // Last 90 days
          }
        }
      });

      const results = this.processTrendingSearchResults(response.results || []);
      this.setCache(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Trending search error:', error);
      throw error;
    }
  }

  /**
   * Search for cocktails by specific spirit
   * @param {string} spirit - Spirit type (gin, vodka, whiskey, etc.)
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Spirit-based cocktail results
   */
  async searchCocktailsBySpirit(spirit, options = {}) {
    if (!this.isConnected) {
      await this.initialize();
    }

    const cacheKey = `spirit:${spirit}:${JSON.stringify(options)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const spiritQuery = `${spirit} cocktails recipes classic modern variations bartender`;

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: {
            query: spiritQuery,
            num_results: options.limit || 12,
            include_domains: [
              'liquor.com',
              'diffordsguide.com',
              'punchdrink.com'
            ],
            use_autoprompt: true
          }
        }
      });

      const results = this.processRecipeSearchResults(response.results || []);
      this.setCache(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Spirit search error:', error);
      throw error;
    }
  }

  /**
   * Search for cocktail techniques and tips
   * @param {string} technique - Technique name or query
   * @returns {Promise<Object[]>} Technique information
   */
  async searchTechniques(technique) {
    if (!this.isConnected) {
      await this.initialize();
    }

    const cacheKey = `technique:${technique}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const techniqueQuery = `${technique} cocktail technique bartending method how to`;

      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'search',
          arguments: {
            query: techniqueQuery,
            num_results: 8,
            include_domains: [
              'liquor.com',
              'masterclass.com',
              'diffordsguide.com',
              'thespruceeats.com'
            ],
            use_autoprompt: true
          }
        }
      });

      const results = this.processTechniqueSearchResults(response.results || []);
      this.setCache(cacheKey, results);

      return results;
    } catch (error) {
      console.error('Technique search error:', error);
      throw error;
    }
  }

  /**
   * Build optimized search query for recipes
   * @param {string} query - Base query
   * @param {Object} options - Search options
   * @returns {string} Optimized search query
   */
  buildRecipeSearchQuery(query, options = {}) {
    let searchQuery = query;

    // Add context keywords
    if (!query.toLowerCase().includes('cocktail') && !query.toLowerCase().includes('drink')) {
      searchQuery += ' cocktail recipe';
    }

    // Add category filters
    if (options.category && options.category !== 'All') {
      searchQuery += ` ${options.category}`;
    }

    // Add flavor profile filters
    if (options.flavorProfile && options.flavorProfile !== 'All') {
      searchQuery += ` ${options.flavorProfile}`;
    }

    // Add alcohol content filters
    if (options.alcoholContent === 'non_alcoholic') {
      searchQuery += ' mocktail non-alcoholic virgin';
    } else if (options.alcoholContent === 'low_alcohol') {
      searchQuery += ' low alcohol light';
    }

    // Add difficulty level
    if (options.difficulty) {
      searchQuery += ` ${options.difficulty} difficulty`;
    }

    return searchQuery;
  }

  /**
   * Process recipe search results
   * @param {Object[]} results - Raw search results
   * @returns {Object[]} Processed results
   */
  processRecipeSearchResults(results) {
    return results.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.text || result.snippet || '',
      domain: new URL(result.url).hostname,
      publishedDate: result.published_date,
      score: result.score || 0,
      type: 'recipe',
      extractedInfo: this.extractRecipeInfo(result.text || result.snippet || '')
    }));
  }

  /**
   * Process ingredient search results
   * @param {Object[]} results - Raw search results
   * @param {string} ingredient - Original ingredient name
   * @returns {Object} Processed ingredient information
   */
  processIngredientSearchResults(results, ingredient) {
    const substitutes = new Set();
    const descriptions = [];
    const tips = [];

    results.forEach(result => {
      const text = (result.text || result.snippet || '').toLowerCase();

      // Extract substitutes
      const substituteMatches = text.match(/substitute[s]?[:\s]+([^.]+)/gi);
      if (substituteMatches) {
        substituteMatches.forEach(match => {
          const subs = match.replace(/substitute[s]?[:\s]+/gi, '').split(/[,;]/);
          subs.forEach(sub => {
            const cleaned = sub.trim().replace(/[^\w\s]/g, '');
            if (cleaned.length > 2 && cleaned.length < 30) {
              substitutes.add(cleaned);
            }
          });
        });
      }

      // Extract descriptions
      if (text.includes(ingredient.toLowerCase())) {
        const sentences = text.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.includes(ingredient.toLowerCase()) && sentence.length > 20) {
            descriptions.push(sentence.trim());
          }
        });
      }
    });

    return {
      ingredient,
      substitutes: Array.from(substitutes).slice(0, 8),
      descriptions: descriptions.slice(0, 3),
      tips,
      sources: results.map(r => ({ title: r.title, url: r.url }))
    };
  }

  /**
   * Process trending search results
   * @param {Object[]} results - Raw search results
   * @returns {Object[]} Processed trending results
   */
  processTrendingSearchResults(results) {
    return results
      .map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.text || result.snippet || '',
        domain: new URL(result.url).hostname,
        publishedDate: result.published_date,
        score: result.score || 0,
        type: 'trending',
        trendingScore: this.calculateTrendingScore(result)
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore);
  }

  /**
   * Process technique search results
   * @param {Object[]} results - Raw search results
   * @returns {Object[]} Processed technique results
   */
  processTechniqueSearchResults(results) {
    return results.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.text || result.snippet || '',
      domain: new URL(result.url).hostname,
      type: 'technique',
      steps: this.extractTechniqueSteps(result.text || result.snippet || '')
    }));
  }

  /**
   * Extract recipe information from text
   * @param {string} text - Text to analyze
   * @returns {Object} Extracted recipe info
   */
  extractRecipeInfo(text) {
    const info = {};

    // Extract ingredients (simple pattern matching)
    const ingredientPattern = /(\d+(?:\.\d+)?)\s*(oz|ml|dash|splash|drop|tsp|tbsp|cup)\s+([a-zA-Z\s]+)/gi;
    const ingredients = [];
    let match;

    while ((match = ingredientPattern.exec(text)) !== null) {
      ingredients.push({
        amount: parseFloat(match[1]),
        unit: match[2],
        name: match[3].trim()
      });
    }

    if (ingredients.length > 0) {
      info.ingredients = ingredients.slice(0, 8); // Limit to 8 ingredients
    }

    // Extract glass type
    const glassPattern = /(rocks|highball|martini|coupe|collins|old fashioned|wine|champagne)\s+glass/gi;
    const glassMatch = text.match(glassPattern);
    if (glassMatch) {
      info.glassType = glassMatch[0];
    }

    // Extract garnish
    const garnishPattern = /garnish[ed]?\s+with\s+([^.]+)/gi;
    const garnishMatch = text.match(garnishPattern);
    if (garnishMatch) {
      info.garnish = garnishMatch[0].replace(/garnish[ed]?\s+with\s+/gi, '').trim();
    }

    return info;
  }

  /**
   * Extract technique steps from text
   * @param {string} text - Text to analyze
   * @returns {string[]} Extracted steps
   */
  extractTechniqueSteps(text) {
    const steps = [];
    const stepPattern = /(\d+\.\s+[^.]+\.)/g;
    let match;

    while ((match = stepPattern.exec(text)) !== null) {
      steps.push(match[1].trim());
    }

    return steps.slice(0, 6); // Limit to 6 steps
  }

  /**
   * Calculate trending score based on recency and relevance
   * @param {Object} result - Search result
   * @returns {number} Trending score
   */
  calculateTrendingScore(result) {
    let score = result.score || 0;

    // Boost score for recent articles
    if (result.published_date) {
      const publishDate = new Date(result.published_date);
      const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSincePublish < 30) {
        score *= 1.5; // 50% boost for articles less than 30 days old
      } else if (daysSincePublish < 90) {
        score *= 1.2; // 20% boost for articles less than 90 days old
      }
    }

    return score;
  }

  /**
   * Get current season for seasonal cocktail recommendations
   * @returns {string} Current season
   */
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
    this.clearCache();
  }
}

// Export singleton instance
export const mcpSearchService = new MCPSearchService();
