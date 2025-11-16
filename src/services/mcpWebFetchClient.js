/**
 * Browser-safe MCP Web Fetch client wrapper.
 * Delegates to a serverless API or warns when unavailable in the browser.
 */
class MCPWebFetchClient {
  constructor() {
    this.allowedDomains = [
      'liquor.com',
      'diffordsguide.com',
      'punchdrink.com',
      'cocktaildb.com',
      'thespruceeats.com',
      'foodnetwork.com'
    ];

    this.apiEndpoint = '/api/mcp/web-fetch';
    this.isConnected = false;
    this.warnedUnavailable = false;
    this.serverServicePromise = null;
  }

  /**
   * Initialize the MCP connection, delegating to the API or server instance.
   */
  async initialize() {
    if (typeof window !== 'undefined') {
      try {
        const response = await this.callApi('initialize');
        this.isConnected = Boolean(response?.connected);
        return this.isConnected;
      } catch (error) {
        this.warnUnavailable(error);
        return false;
      }
    }

    const service = await this.getServerService();
    if (!service.isConnected) {
      await service.initialize();
    }
    this.isConnected = service.isConnected;
    return this.isConnected;
  }

  /**
   * Fetch and parse a single recipe URL.
   */
  async fetchRecipe(url) {
    if (!this.isValidDomain(url)) {
      throw new Error(`Domain not allowed. Supported domains: ${this.allowedDomains.join(', ')}`);
    }

    if (typeof window !== 'undefined') {
      const recipe = await this.callApi('fetchRecipe', { url });
      this.isConnected = true;
      return recipe;
    }

    const service = await this.getServerService();
    const recipe = await service.fetchRecipe(url);
    this.isConnected = service.isConnected;
    return recipe;
  }

  /**
   * Fetch multiple recipes with optional progress callback.
   */
  async batchFetchRecipes(urls, onProgress = null) {
    if (!Array.isArray(urls) || urls.length === 0) {
      return {
        recipes: [],
        errors: [],
        summary: { total: 0, successful: 0, failed: 0 }
      };
    }

    if (typeof window !== 'undefined') {
      if (onProgress) {
        onProgress({ current: 0, total: urls.length, status: 'queued' });
      }

      const result = await this.callApi('batchFetchRecipes', { urls });

      if (onProgress) {
        onProgress({ current: urls.length, total: urls.length, status: 'completed' });
      }

      this.isConnected = true;
      return result;
    }

    const service = await this.getServerService();
    const result = await service.batchFetchRecipes(urls, onProgress || undefined);
    this.isConnected = service.isConnected;
    return result;
  }

  /**
   * Search for recipes across supported domains.
   */
  async searchRecipes(query, domain = null) {
    if (typeof window !== 'undefined') {
      const results = await this.callApi('searchRecipes', { query, domain });
      this.isConnected = true;
      return results;
    }

    const service = await this.getServerService();
    const results = await service.searchRecipes(query, domain || undefined);
    this.isConnected = service.isConnected;
    return results;
  }

  /**
   * Determine whether a given URL belongs to an allowed domain.
   */
  isValidDomain(url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return this.allowedDomains.some((allowedDomain) => domain.includes(allowedDomain));
    } catch {
      return false;
    }
  }

  /**
   * Disconnect the underlying MCP session.
   */
  async disconnect() {
    if (typeof window !== 'undefined') {
      try {
        await this.callApi('disconnect');
      } catch (error) {
        this.warnUnavailable(error);
      }

      this.isConnected = false;
      return;
    }

    if (!this.serverServicePromise) {
      return;
    }

    const service = await this.serverServicePromise;
    await service.disconnect();
    this.isConnected = false;
  }

  /**
   * Call the serverless API endpoint.
   */
  async callApi(action, payload = {}) {
    if (typeof window === 'undefined') {
      throw new Error('API calls are only available in a browser environment');
    }

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error(`Failed to parse MCP response: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    if (!response.ok || !data.success) {
      const message = data?.error || `Failed to execute MCP action: ${action}`;
      throw new Error(message);
    }

    return data.data;
  }

  /**
   * Lazily load the server-side service when running in Node.
   */
  async getServerService() {
    if (typeof window !== 'undefined') {
      throw new Error('Server service is not available in the browser');
    }

    if (!this.serverServicePromise) {
      this.serverServicePromise = import('../../server/mcpWebFetchService.js').then((module) => {
        return module.mcpWebFetchService || new module.MCPWebFetchService();
      });
    }

    const service = await this.serverServicePromise;

    if (!service.isConnected) {
      await service.initialize();
    }

    return service;
  }

  /**
   * Warn once when the service is unavailable in the browser.
   */
  warnUnavailable(error) {
    if (this.warnedUnavailable) {
      return;
    }

    this.warnedUnavailable = true;
    const message = error instanceof Error ? error.message : 'Unknown MCP error';
    console.warn('MCP Web Fetch is unavailable in the browser environment:', message);
  }
}

export const mcpWebFetchClient = new MCPWebFetchClient();
export default mcpWebFetchClient;
