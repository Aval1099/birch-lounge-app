// =============================================================================
// CACHE PERFORMANCE DASHBOARD COMPONENT
// =============================================================================

import React, { useState, useEffect } from 'react';

import { useApp } from '../../hooks/useApp';
import { cachePerformanceConfig } from '../../services/cachePerformanceConfig';
import { cachePerformanceMonitor } from '../../services/cachePerformanceMonitor';
import { intelligentCacheService } from '../../services/intelligentCacheService';

/**
 * Cache Performance Dashboard
 * Displays real-time cache performance metrics and alerts
 */
const CachePerformanceDashboard = () => {
  const { state } = useApp();
  const { serviceMode } = state;
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [birchLoungeMetrics, setBirchLoungeMetrics] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Start monitoring when component mounts with config-based intervals
    cachePerformanceMonitor.startMonitoring(); // Uses config intervals
    setIsMonitoring(true);

    // Initial data load
    updateMetrics();

    // Set up periodic updates using config refresh rate
    const config = cachePerformanceConfig.getConfig();
    const interval = setInterval(updateMetrics, config.monitoring.dashboardRefreshRate);

    return () => {
      clearInterval(interval);
      cachePerformanceMonitor.stopMonitoring();
      setIsMonitoring(false);
    };
  }, []);

  // Handle service mode changes
  useEffect(() => {
    if (serviceMode) {
      cachePerformanceMonitor.enableServiceModeOptimizations();
    } else {
      cachePerformanceMonitor.disableServiceModeOptimizations();
    }
  }, [serviceMode]);

  const updateMetrics = () => {
    try {
      const currentMetrics = cachePerformanceMonitor.getMetrics();
      const currentSummary = cachePerformanceMonitor.getPerformanceSummary();
      const currentAlerts = cachePerformanceMonitor.getActiveAlerts();
      const currentBirchLoungeMetrics = cachePerformanceMonitor.getBirchLoungeMetrics();

      setMetrics(currentMetrics);
      setSummary(currentSummary);
      setAlerts(currentAlerts);
      setBirchLoungeMetrics(currentBirchLoungeMetrics);
    } catch (error) {
      console.error('Failed to update cache performance metrics:', error);
    }
  };

  const handleOptimizeCache = async () => {
    try {
      await intelligentCacheService.forceOptimization();
      // Record the optimization operation
      cachePerformanceMonitor.recordAccess();
      updateMetrics();
    } catch (error) {
      console.error('Failed to optimize cache:', error);
      cachePerformanceMonitor.recordError();
    }
  };

  const handleClearCache = async () => {
    try {
      await intelligentCacheService.clearCache();
      cachePerformanceMonitor.recordAccess();
      updateMetrics();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      cachePerformanceMonitor.recordError();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const _formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!metrics || !summary || !birchLoungeMetrics) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cache Performance</h2>
            <p className="text-gray-600 mt-1">Real-time monitoring and optimization</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleOptimizeCache}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Optimize Cache
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(summary.status)}`}>
            {summary.status.toUpperCase()}
          </div>
          <span className="text-gray-700">{summary.summary}</span>
          {isMonitoring && (
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
              Monitoring Active
            </div>
          )}
        </div>
      </div>

      {/* Birch Lounge Specific Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Birch Lounge Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${birchLoungeMetrics.searchResponseTimeCompliance ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">Search Response</div>
              <div className="text-xs text-gray-600">
                {birchLoungeMetrics.searchResponseTimeCompliance ? '<100ms ✓' : '>100ms ✗'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${birchLoungeMetrics.serviceModeActive ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">Service Mode</div>
              <div className="text-xs text-gray-600">
                {birchLoungeMetrics.serviceModeActive ? 'Optimized' : 'Standard'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${birchLoungeMetrics.mobileOptimized ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">Mobile Ready</div>
              <div className="text-xs text-gray-600">
                {birchLoungeMetrics.mobileOptimized ? 'Optimized' : 'Standard'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${birchLoungeMetrics.offlineReady ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <div>
              <div className="text-sm font-medium text-gray-900">PWA Offline</div>
              <div className="text-xs text-gray-600">
                {birchLoungeMetrics.offlineReady ? 'Ready' : 'Limited'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-md border-l-4 ${alert.type === 'critical'
                  ? 'bg-red-50 border-red-400 text-red-700'
                  : 'bg-yellow-50 border-yellow-400 text-yellow-700'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{alert.message}</span>
                  <span className="text-sm opacity-75">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Response Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Response Time</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.averageResponseTime.toFixed(1)}ms
            </div>
            <div className="text-sm text-gray-600 mt-1">
              P95: {metrics.p95ResponseTime.toFixed(1)}ms
            </div>
          </div>
        </div>

        {/* Hit Rate */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Hit Rate</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(metrics.hitRate)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Miss Rate: {formatPercentage(metrics.missRate)}
            </div>
          </div>
        </div>

        {/* Storage Utilization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Storage</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatPercentage(metrics.storageUtilization)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Compression: {formatPercentage(metrics.compressionEfficiency)}
            </div>
          </div>
        </div>

        {/* Access Frequency */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Activity</h3>
          <div className="mt-2">
            <div className="text-2xl font-bold text-gray-900">
              {metrics.accessFrequency}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Accesses/min
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Hot Data Ratio:</span>
              <span className="font-medium">{formatPercentage(metrics.hotDataRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory Pressure:</span>
              <span className="font-medium">{formatPercentage(metrics.memoryPressure)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate:</span>
              <span className="font-medium">{metrics.errorRate.toFixed(1)}/1000</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">P99 Response Time:</span>
              <span className="font-medium">{metrics.p99ResponseTime.toFixed(1)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium">
                {new Date(metrics.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Measurement Period:</span>
              <span className="font-medium">{metrics.measurementPeriod / 1000}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CachePerformanceDashboard;
