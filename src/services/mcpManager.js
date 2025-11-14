/**
 * MCP Manager - Central coordination for all MCP services
 * Manages connections, health checks, and service orchestration
 */

import { mcpDatabaseService } from './mcpDatabaseService.js';
import { mcpExcelService } from './mcpExcelService.js';
import { mcpGitHubService } from './mcpGitHubService.js';
import { mcpNotionService } from './mcpNotionService.js';
import { mcpOpenAIService } from './mcpOpenAIService.js';
import { mcpSearchService } from './mcpSearchService.js';
import { mcpWebFetchClient } from './mcpWebFetchClient.js';

class MCPManager {
  constructor() {
    this.services = new Map();
    this.healthCheckInterval = null;
    this.isInitialized = false;
    this.connectionStatus = new Map();

    // Register all MCP services
    this.registerServices();
  }

  /**
   * Register all MCP services
   */
  registerServices() {
    this.services.set('webFetch', {
      service: mcpWebFetchClient,
      priority: 'high',
      category: 'recipe-management',
      description: 'Web-based recipe discovery and import'
    });

    this.services.set('excel', {
      service: mcpExcelService,
      priority: 'high',
      category: 'recipe-management',
      description: 'Bulk recipe import/export operations'
    });

    this.services.set('database', {
      service: mcpDatabaseService,
      priority: 'medium',
      category: 'analytics',
      description: 'Advanced recipe analytics and reporting'
    });

    this.services.set('search', {
      service: mcpSearchService,
      priority: 'high',
      category: 'service-mode',
      description: 'Real-time recipe and ingredient search'
    });

    this.services.set('notion', {
      service: mcpNotionService,
      priority: 'medium',
      category: 'documentation',
      description: 'Comprehensive recipe documentation'
    });

    this.services.set('github', {
      service: mcpGitHubService,
      priority: 'low',
      category: 'collaboration',
      description: 'Recipe version control and collaboration'
    });

    this.services.set('openai', {
      service: mcpOpenAIService,
      priority: 'medium',
      category: 'ai-enhancement',
      description: 'Enhanced AI capabilities and analysis'
    });
  }

  /**
   * Initialize all MCP services
   * @param {Object} options - Initialization options
   * @returns {Promise<Object>} Initialization results
   */
  async initialize(_options = {}) {
    if (this.isInitialized) {
      return this.getConnectionStatus();
    }

    const results = {
      successful: [],
      failed: [],
      summary: {
        total: this.services.size,
        connected: 0,
        failed: 0
      }
    };

    // Initialize services by priority
    const priorityOrder = ['high', 'medium', 'low'];

    for (const priority of priorityOrder) {
      const servicesOfPriority = Array.from(this.services.entries())
        .filter(([_, config]) => config.priority === priority);

      // Initialize high-priority services in parallel, others sequentially
      if (priority === 'high') {
        await this.initializeServicesParallel(servicesOfPriority, results);
      } else {
        await this.initializeServicesSequential(servicesOfPriority, results);
      }
    }

    this.isInitialized = true;

    // Start health monitoring
    this.startHealthMonitoring();

    return results;
  }

  /**
   * Initialize services in parallel
   * @param {Array} services - Services to initialize
   * @param {Object} results - Results object to update
   */
  async initializeServicesParallel(services, results) {
    const initPromises = services.map(async ([name, config]) => {
      try {
        const success = await config.service.initialize();
        this.connectionStatus.set(name, {
          connected: success,
          lastCheck: new Date(),
          error: null,
          config
        });

        if (success) {
          results.successful.push(name);
          results.summary.connected++;
        } else {
          results.failed.push({ service: name, error: 'Initialization failed' });
          results.summary.failed++;
        }
      } catch (error) {
        this.connectionStatus.set(name, {
          connected: false,
          lastCheck: new Date(),
          error: error.message,
          config
        });

        results.failed.push({ service: name, error: error.message });
        results.summary.failed++;
      }
    });

    await Promise.all(initPromises);
  }

  /**
   * Initialize services sequentially
   * @param {Array} services - Services to initialize
   * @param {Object} results - Results object to update
   */
  async initializeServicesSequential(services, results) {
    for (const [name, config] of services) {
      try {
        const success = await config.service.initialize();
        this.connectionStatus.set(name, {
          connected: success,
          lastCheck: new Date(),
          error: null,
          config
        });

        if (success) {
          results.successful.push(name);
          results.summary.connected++;
        } else {
          results.failed.push({ service: name, error: 'Initialization failed' });
          results.summary.failed++;
        }

        // Small delay between sequential initializations
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        this.connectionStatus.set(name, {
          connected: false,
          lastCheck: new Date(),
          error: error.message,
          config
        });

        results.failed.push({ service: name, error: error.message });
        results.summary.failed++;
      }
    }
  }

  /**
   * Get service by name
   * @param {string} serviceName - Name of service
   * @returns {Object|null} Service instance
   */
  getService(serviceName) {
    const serviceConfig = this.services.get(serviceName);
    return serviceConfig ? serviceConfig.service : null;
  }

  /**
   * Check if service is available
   * @param {string} serviceName - Name of service
   * @returns {boolean} Service availability
   */
  isServiceAvailable(serviceName) {
    const status = this.connectionStatus.get(serviceName);
    return status ? status.connected : false;
  }

  /**
   * Get services by category
   * @param {string} category - Service category
   * @returns {Object[]} Services in category
   */
  getServicesByCategory(category) {
    return Array.from(this.services.entries())
      .filter(([_, config]) => config.category === category)
      .map(([name, config]) => ({
        name,
        service: config.service,
        status: this.connectionStatus.get(name),
        ...config
      }));
  }

  /**
   * Get connection status for all services
   * @returns {Object} Connection status summary
   */
  getConnectionStatus() {
    const status = {
      overall: 'healthy',
      services: {},
      summary: {
        total: this.services.size,
        connected: 0,
        disconnected: 0,
        errors: 0
      }
    };

    for (const [name, serviceStatus] of this.connectionStatus.entries()) {
      status.services[name] = serviceStatus;

      if (serviceStatus.connected) {
        status.summary.connected++;
      } else {
        status.summary.disconnected++;
        if (serviceStatus.error) {
          status.summary.errors++;
        }
      }
    }

    // Determine overall health
    const healthyPercentage = (status.summary.connected / status.summary.total) * 100;
    if (healthyPercentage >= 80) {
      status.overall = 'healthy';
    } else if (healthyPercentage >= 50) {
      status.overall = 'degraded';
    } else {
      status.overall = 'unhealthy';
    }

    return status;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Check every minute
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck() {
    for (const [name, config] of this.services.entries()) {
      try {
        // Simple health check - try to access the service
        const isHealthy = config.service.isConnected !== undefined
          ? config.service.isConnected
          : true;

        this.connectionStatus.set(name, {
          ...this.connectionStatus.get(name),
          connected: isHealthy,
          lastCheck: new Date(),
          error: isHealthy ? null : 'Health check failed'
        });

      } catch (error) {
        this.connectionStatus.set(name, {
          ...this.connectionStatus.get(name),
          connected: false,
          lastCheck: new Date(),
          error: error.message
        });
      }
    }
  }

  /**
   * Reconnect failed services
   * @returns {Promise<Object>} Reconnection results
   */
  async reconnectFailedServices() {
    const failedServices = Array.from(this.connectionStatus.entries())
      .filter(([_, status]) => !status.connected)
      .map(([name, _]) => name);

    const results = {
      attempted: failedServices.length,
      successful: [],
      failed: []
    };

    for (const serviceName of failedServices) {
      try {
        const config = this.services.get(serviceName);
        const success = await config.service.initialize();

        this.connectionStatus.set(serviceName, {
          connected: success,
          lastCheck: new Date(),
          error: success ? null : 'Reconnection failed',
          config
        });

        if (success) {
          results.successful.push(serviceName);
        } else {
          results.failed.push(serviceName);
        }

      } catch (error) {
        this.connectionStatus.set(serviceName, {
          connected: false,
          lastCheck: new Date(),
          error: error.message,
          config: this.services.get(serviceName)
        });

        results.failed.push(serviceName);
      }
    }

    return results;
  }

  /**
   * Execute operation across multiple services
   * @param {string} operation - Operation name
   * @param {Object} data - Operation data
   * @param {string[]} serviceNames - Services to use (optional)
   * @returns {Promise<Object>} Operation results
   */
  async executeOperation(operation, data, serviceNames = null) {
    const targetServices = serviceNames
      ? serviceNames.filter(name => this.services.has(name))
      : Array.from(this.services.keys());

    const results = {
      operation,
      successful: [],
      failed: [],
      results: {}
    };

    for (const serviceName of targetServices) {
      if (!this.isServiceAvailable(serviceName)) {
        results.failed.push({
          service: serviceName,
          error: 'Service not available'
        });
        continue;
      }

      try {
        const service = this.getService(serviceName);

        if (service && typeof service[operation] === 'function') {
          const result = await service[operation](data);
          results.successful.push(serviceName);
          results.results[serviceName] = result;
        } else {
          results.failed.push({
            service: serviceName,
            error: `Operation '${operation}' not supported`
          });
        }

      } catch (error) {
        results.failed.push({
          service: serviceName,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get service recommendations based on use case
   * @param {string} useCase - Use case identifier
   * @returns {string[]} Recommended service names
   */
  getServiceRecommendations(useCase) {
    const recommendations = {
      'recipe-import': ['webFetch', 'excel'],
      'recipe-export': ['excel', 'github', 'notion'],
      'recipe-analysis': ['openai', 'database'],
      'service-mode': ['search', 'database'],
      'collaboration': ['github', 'notion'],
      'training': ['notion', 'openai'],
      'analytics': ['database', 'openai']
    };

    return recommendations[useCase] || [];
  }

  /**
   * Cleanup and disconnect all services
   */
  async cleanup() {
    this.stopHealthMonitoring();

    const disconnectPromises = Array.from(this.services.values()).map(config => {
      if (config.service && typeof config.service.disconnect === 'function') {
        return config.service.disconnect();
      }
      return Promise.resolve();
    });

    await Promise.all(disconnectPromises);

    this.connectionStatus.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const mcpManager = new MCPManager();
