/**
 * MCP Dashboard Component - Monitor and manage MCP services
 * Provides centralized control and status monitoring for all MCP integrations
 */

import { 
  Activity, AlertCircle, CheckCircle, RefreshCw, Settings, 
  Database, Globe, FileSpreadsheet, Search, Book, Github, 
  Zap, Wifi, WifiOff, TrendingUp, Download, Upload
} from 'lucide-react';
import { useState, useEffect, useCallback, memo } from 'react';

import { ActionType } from '../../constants';
import { useApp } from '../../hooks/useApp';
import { mcpManager } from '../../services/mcpManager';
import { Button, Card, Modal, ProgressBar, Toast } from '../ui';

const MCPDashboard = memo(({ isOpen, onClose }) => {
  const { dispatch } = useApp();
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Service icons mapping
  const serviceIcons = {
    webFetch: Globe,
    excel: FileSpreadsheet,
    database: Database,
    search: Search,
    notion: Book,
    github: Github,
    openai: Zap
  };

  /**
   * Load connection status
   */
  const loadConnectionStatus = useCallback(async () => {
    try {
      const status = mcpManager.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Error loading MCP status:', error);
    }
  }, []);

  /**
   * Initialize MCP services
   */
  const handleInitialize = useCallback(async () => {
    setIsInitializing(true);
    
    try {
      const results = await mcpManager.initialize();
      
      dispatch({
        type: ActionType.SHOW_NOTIFICATION,
        payload: {
          message: `MCP Services initialized: ${results.summary.connected}/${results.summary.total} connected`,
          type: results.summary.connected > 0 ? 'success' : 'warning'
        }
      });

      await loadConnectionStatus();
    } catch (error) {
      dispatch({
        type: ActionType.SHOW_NOTIFICATION,
        payload: {
          message: `MCP initialization failed: ${error.message}`,
          type: 'error'
        }
      });
    } finally {
      setIsInitializing(false);
    }
  }, [dispatch, loadConnectionStatus]);

  /**
   * Reconnect failed services
   */
  const handleReconnect = useCallback(async () => {
    setIsReconnecting(true);
    
    try {
      const results = await mcpManager.reconnectFailedServices();
      
      dispatch({
        type: ActionType.SHOW_NOTIFICATION,
        payload: {
          message: `Reconnection complete: ${results.successful.length} services restored`,
          type: results.successful.length > 0 ? 'success' : 'warning'
        }
      });

      await loadConnectionStatus();
    } catch (error) {
      dispatch({
        type: ActionType.SHOW_NOTIFICATION,
        payload: {
          message: `Reconnection failed: ${error.message}`,
          type: 'error'
        }
      });
    } finally {
      setIsReconnecting(false);
    }
  }, [dispatch, loadConnectionStatus]);

  /**
   * Get status color
   */
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 dark:text-green-400';
      case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
      case 'unhealthy': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  }, []);

  /**
   * Get status icon
   */
  const getStatusIcon = useCallback((connected) => {
    return connected ? (
      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
    ) : (
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    );
  }, []);

  // Load status on mount and set up polling
  useEffect(() => {
    if (isOpen) {
      loadConnectionStatus();
      
      const interval = setInterval(loadConnectionStatus, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, loadConnectionStatus]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="MCP Services Dashboard"
      size="large"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              variant="primary"
              size="sm"
            >
              {isInitializing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
              {isInitializing ? 'Initializing...' : 'Initialize Services'}
            </Button>
            
            <Button
              onClick={handleReconnect}
              disabled={isReconnecting || !connectionStatus}
              variant="secondary"
              size="sm"
            >
              {isReconnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Reconnect Failed
            </Button>
          </div>

          <Button
            onClick={loadConnectionStatus}
            variant="ghost"
            size="sm"
            ariaLabel="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['overview', 'services', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && connectionStatus && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Overall Status
                  </h3>
                  <p className={`text-sm ${getStatusColor(connectionStatus.overall)}`}>
                    {connectionStatus.overall.charAt(0).toUpperCase() + connectionStatus.overall.slice(1)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {connectionStatus.overall === 'healthy' ? (
                    <Wifi className="w-8 h-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {connectionStatus.summary.connected}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connected</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {connectionStatus.summary.disconnected}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Disconnected</div>
              </Card>
              
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {connectionStatus.summary.errors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
              </Card>
            </div>

            {/* Health Progress */}
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Service Health
              </h4>
              <ProgressBar
                value={(connectionStatus.summary.connected / connectionStatus.summary.total) * 100}
                className="w-full"
                color={connectionStatus.overall === 'healthy' ? 'green' : 
                       connectionStatus.overall === 'degraded' ? 'yellow' : 'red'}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {connectionStatus.summary.connected} of {connectionStatus.summary.total} services operational
              </p>
            </Card>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && connectionStatus && (
          <div className="space-y-4">
            {Object.entries(connectionStatus.services).map(([serviceName, status]) => {
              const IconComponent = serviceIcons[serviceName] || Activity;
              
              return (
                <Card 
                  key={serviceName}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedService === serviceName ? 'ring-2 ring-amber-500' : ''
                  }`}
                  onClick={() => setSelectedService(selectedService === serviceName ? null : serviceName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {status.config?.description || 'MCP Service'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        status.config?.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        status.config?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {status.config?.priority || 'unknown'}
                      </span>
                      {getStatusIcon(status.connected)}
                    </div>
                  </div>

                  {/* Service Details (Expanded) */}
                  {selectedService === serviceName && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                          <span className={`ml-2 ${status.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {status.connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {status.config?.category || 'unknown'}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Last Check:</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'Never'}
                          </span>
                        </div>
                        
                        {status.error && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Error:</span>
                            <span className="ml-2 text-red-600 dark:text-red-400">
                              {status.error}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Service Categories
              </h4>
              
              <div className="space-y-3">
                {['recipe-management', 'service-mode', 'analytics', 'documentation', 'collaboration', 'ai-enhancement'].map(category => {
                  const categoryServices = mcpManager.getServicesByCategory(category);
                  const connectedCount = categoryServices.filter(s => s.status?.connected).length;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {connectedCount}/{categoryServices.length}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${
                          connectedCount === categoryServices.length ? 'bg-green-500' :
                          connectedCount > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start"
                  disabled={!mcpManager.isServiceAvailable('webFetch')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Import Recipes
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start"
                  disabled={!mcpManager.isServiceAvailable('excel')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start"
                  disabled={!mcpManager.isServiceAvailable('search')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Recipes
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start"
                  disabled={!mcpManager.isServiceAvailable('database')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* No Status Message */}
        {!connectionStatus && (
          <Card className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              MCP Services Not Initialized
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Click "Initialize Services" to connect to MCP servers and enable enhanced functionality.
            </p>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              variant="primary"
            >
              {isInitializing ? 'Initializing...' : 'Initialize Services'}
            </Button>
          </Card>
        )}
      </div>
    </Modal>
  );
});

MCPDashboard.displayName = 'MCPDashboard';

export default MCPDashboard;
