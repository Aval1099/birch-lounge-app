/**
 * MCP Web Fetch Service for Recipe Discovery
 * Integrates with @modelcontextprotocol/server-fetch for web scraping
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import { enhancedRecipeParser } from '../src/services/enhancedRecipeParser.js';

class MCPWebFetchService {
  constructor() {
    this.client = null;
    this.transport = null;
    this.isConnected = false;
    this.allowedDomains = [
      'liquor.com',
      'diffordsguide.com',
      'punchdrink.com',
      'cocktaildb.com',
      'thespruceeats.com',
      'foodnetwork.com'
    ];
  }

  /**
   * Initialize MCP Web Fetch connection
   */
  async initialize() {
    try {
      // Create transport for MCP server
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['@modelcontextprotocol/server-fetch'],
        env: {
          ...process.env,
          MCP_ALLOWED_DOMAINS: this.allowedDomains.join(',')
        }
      });

      this.client = new Client({
        name: 'birch-lounge-web-fetch',
        version: '1.0.0'
      }, {
        capabilities: {
          tools: {}
        }
      });

      await this.client.connect(this.transport);
      this.isConnected = true;

      console.warn('MCP Web Fetch Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MCP Web Fetch Service:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Fetch and parse recipe from URL
   * @param {string} url - Recipe URL to fetch
   * @returns {Promise<Object|null>} Parsed recipe data
   */
  async fetchRecipe(url) {
    if (!this.isConnected) {
      await this.initialize();
    }

    if (!this.isValidDomain(url)) {
      throw new Error(`Domain not allowed. Supported domains: ${this.allowedDomains.join(', ')}`);
    }

    try {
      // Fetch web content using MCP
      const response = await this.client.request({
        method: 'tools/call',
        params: {
          name: 'fetch',
          arguments: {
            url,
            headers: {
              'User-Agent': 'Birch-Lounge-Recipe-Manager/1.0'
            }
          }
        }
      });

      if (!response.content || !response.content[0]) {
        throw new Error('No content received from URL');
      }

      const htmlContent = response.content[0].text;

      // Parse recipe from HTML content
      const parsedRecipe = await this.parseRecipeFromHTML(htmlContent, url);

      if (!parsedRecipe) {
        throw new Error('Could not extract recipe from webpage');
      }

      return {
        ...parsedRecipe,
        source: url,
        importedAt: new Date().toISOString(),
        verified: false // Mark as unverified for manual review
      };

    } catch (error) {
      console.error('Error fetching recipe:', error);
      throw error;
    }
  }

  /**
   * Batch fetch recipes from multiple URLs
   * @param {string[]} urls - Array of recipe URLs
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} Array of parsed recipes
   */
  async batchFetchRecipes(urls, onProgress = null) {
    const results = [];
    const errors = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: urls.length,
            url,
            status: 'fetching'
          });
        }

        const recipe = await this.fetchRecipe(url);
        if (recipe) {
          results.push(recipe);
        }

        // Rate limiting - wait 1 second between requests
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`Error fetching recipe from ${url}:`, error);
        errors.push({ url, error: error.message });
      }

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: urls.length,
          url,
          status: 'completed'
        });
      }
    }

    return {
      recipes: results,
      errors,
      summary: {
        total: urls.length,
        successful: results.length,
        failed: errors.length
      }
    };
  }

  /**
   * Search for recipes on supported websites
   * @param {string} query - Search query
   * @param {string} domain - Specific domain to search (optional)
   * @returns {Promise<Object[]>} Search results with URLs
   */
  async searchRecipes(query, domain = null) {
    const searchUrls = [];
    const domainsToSearch = domain ? [domain] : this.allowedDomains;

    for (const searchDomain of domainsToSearch) {
      const searchUrl = this.buildSearchUrl(searchDomain, query);
      if (searchUrl) {
        searchUrls.push(searchUrl);
      }
    }

    const searchResults = [];

    for (const searchUrl of searchUrls) {
      try {
        const response = await this.client.request({
          method: 'tools/call',
          params: {
            name: 'fetch',
            arguments: {
              url: searchUrl,
              headers: {
                'User-Agent': 'Birch-Lounge-Recipe-Manager/1.0'
              }
            }
          }
        });

        if (response.content && response.content[0]) {
          const htmlContent = response.content[0].text;
          const recipeLinks = this.extractRecipeLinks(htmlContent, searchUrl);
          searchResults.push(...recipeLinks);
        }

      } catch (error) {
        console.error(`Error searching ${searchUrl}:`, error);
      }
    }

    return searchResults;
  }

  /**
   * Parse recipe from HTML content
   * @param {string} html - HTML content
   * @param {string} sourceUrl - Source URL
   * @returns {Promise<Object|null>} Parsed recipe
   */
  async parseRecipeFromHTML(html, sourceUrl) {
    try {
      // Use existing enhanced recipe parser
      const recipeText = this.extractRecipeText(html);

      if (!recipeText) {
        return null;
      }

      // Parse using existing parser
      const parsedRecipe = await enhancedRecipeParser.parseRecipe(recipeText);

      if (parsedRecipe && parsedRecipe.name) {
        return {
          ...parsedRecipe,
          source: sourceUrl,
          extractedText: recipeText
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing recipe from HTML:', error);
      return null;
    }
  }

  /**
   * Extract recipe text from HTML using common selectors
   * @param {string} html - HTML content
   * @returns {string|null} Extracted recipe text
   */
  extractRecipeText(html) {
    // Common recipe selectors
    const recipeSelectors = [
      '.recipe',
      '.recipe-card',
      '.recipe-content',
      '[itemtype*="Recipe"]',
      '.entry-content',
      '.post-content',
      'main',
      'article'
    ];

    // Simple HTML parsing (in production, consider using a proper HTML parser)
    for (const selector of recipeSelectors) {
      const regex = new RegExp(`<[^>]*class="[^"]*${selector.slice(1)}[^"]*"[^>]*>(.*?)</[^>]*>`, 'gis');
      const match = regex.exec(html);

      if (match && match[1]) {
        // Clean HTML tags
        const cleanText = match[1]
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length > 100) { // Ensure meaningful content
          return cleanText;
        }
      }
    }

    return null;
  }

  /**
   * Build search URL for domain
   * @param {string} domain - Domain to search
   * @param {string} query - Search query
   * @returns {string|null} Search URL
   */
  buildSearchUrl(domain, query) {
    const encodedQuery = encodeURIComponent(query);

    const searchPatterns = {
      'liquor.com': `https://www.liquor.com/search?q=${encodedQuery}`,
      'diffordsguide.com': `https://www.diffordsguide.com/cocktails/search?term=${encodedQuery}`,
      'punchdrink.com': `https://punchdrink.com/search?q=${encodedQuery}`,
      'thespruceeats.com': `https://www.thespruceeats.com/search?q=${encodedQuery}+cocktail`
    };

    return searchPatterns[domain] || null;
  }

  /**
   * Extract recipe links from search results
   * @param {string} html - Search results HTML
   * @param {string} baseUrl - Base URL for relative links
   * @returns {Object[]} Recipe links with metadata
   */
  extractRecipeLinks(html, baseUrl) {
    const links = [];
    const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].replace(/<[^>]*>/g, '').trim();

      // Filter for recipe-like links
      if (this.isRecipeLink(href, title)) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;

        links.push({
          url: fullUrl,
          title,
          domain: new URL(fullUrl).hostname
        });
      }
    }

    return links;
  }

  /**
   * Check if URL/title appears to be a recipe
   * @param {string} href - Link href
   * @param {string} title - Link title
   * @returns {boolean} Is likely a recipe link
   */
  isRecipeLink(href, title) {
    const recipeKeywords = [
      'recipe', 'cocktail', 'drink', 'martini', 'whiskey', 'gin', 'vodka',
      'rum', 'tequila', 'bourbon', 'scotch', 'brandy', 'liqueur'
    ];

    const combinedText = (`${href} ${title}`).toLowerCase();

    return recipeKeywords.some(keyword => combinedText.includes(keyword)) &&
      !combinedText.includes('search') &&
      !combinedText.includes('category') &&
      !combinedText.includes('tag');
  }

  /**
   * Check if domain is allowed
   * @param {string} url - URL to check
   * @returns {boolean} Is domain allowed
   */
  isValidDomain(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return this.allowedDomains.some(allowed => domain.includes(allowed));
    } catch {
      return false;
    }
  }

  /**
   * Cleanup and disconnect
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }
}

// Export singleton instance and class for server usage
export const mcpWebFetchService = new MCPWebFetchService();
export { MCPWebFetchService };
