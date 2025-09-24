import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  Gauge,
  TrendingUp
} from 'lucide-react';
import type { PerformanceDashboardProps } from '../../types/performance';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { PerformanceMetricCard } from './PerformanceMetricCard';
import { PerformanceChart } from './PerformanceChart';
import { PerformanceAlerts } from './PerformanceAlerts';

/**
 * Performance Dashboard Component
 * Provides real-time performance monitoring and analytics
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isOpen,
  onClose,
  showRealTime: _showRealTime = true,
  showAlerts: _showAlerts = true,
  showReports: _showReports = true
}) => {
  const {
    webVitals,
    customMetrics,
    currentSession,
    isMonitoring,
    getPerformanceScore,
    getLatestAlerts,
    clearData,
    generateReport
  } = usePerformanceMonitoring();

  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'custom' | 'alerts' | 'reports'>('overview');

  // Calculate performance score
  const performanceScore = useMemo(() => getPerformanceScore(), [getPerformanceScore]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get score status
  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  // Calculate averages for custom metrics
  const averageApiResponse = useMemo(() => {
    const allTimes = Object.values(customMetrics.apiResponseTimes).flat();
    return allTimes.length > 0 ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : null;
  }, [customMetrics.apiResponseTimes]);

  const averageSearchResponse = useMemo(() => {
    const times = customMetrics.searchResponseTimes;
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : null;
  }, [customMetrics.searchResponseTimes]);

  const latestMemoryUsage = useMemo(() => {
    return customMetrics.memoryUsage.length > 0
      ? customMetrics.memoryUsage[customMetrics.memoryUsage.length - 1].usedJSHeapSize / (1024 * 1024)
      : null;
  }, [customMetrics.memoryUsage]);

  // Handle export report
  const handleExportReport = () => {
    const report = generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'vitals', label: 'Web Vitals', icon: Activity },
    { id: 'custom', label: 'Custom Metrics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: TrendingUp }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Performance Dashboard"
      size="xl"
      className="max-w-6xl"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>

            {currentSession && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Session: {new Date(currentSession.startTime).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportReport}
              icon={Download}
            >
              Export Report
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearData}
              className="text-red-600 hover:text-red-700"
            >
              Clear Data
            </Button>
          </div>
        </div>

        {/* Performance Score */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(performanceScore)}`}>
                {Math.round(performanceScore)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Performance Score
              </div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${getScoreColor(performanceScore)}`}>
                {getScoreStatus(performanceScore)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Status
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PerformanceMetricCard
                title="Largest Contentful Paint"
                value={webVitals.lcp}
                threshold={2500}
                unit="ms"
                description="Time until the largest content element is rendered"
              />
              <PerformanceMetricCard
                title="First Input Delay"
                value={webVitals.fid}
                threshold={100}
                unit="ms"
                description="Time from first user interaction to browser response"
              />
              <PerformanceMetricCard
                title="Cumulative Layout Shift"
                value={webVitals.cls}
                threshold={0.1}
                unit=""
                description="Visual stability of the page during loading"
              />
              <PerformanceMetricCard
                title="API Response Time"
                value={averageApiResponse}
                threshold={500}
                unit="ms"
                description="Average time for API calls to complete"
              />
              <PerformanceMetricCard
                title="Search Response"
                value={averageSearchResponse}
                threshold={100}
                unit="ms"
                description="Time for search results to appear"
              />
              <PerformanceMetricCard
                title="Memory Usage"
                value={latestMemoryUsage}
                threshold={100}
                unit="MB"
                description="Current JavaScript heap memory usage"
              />
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PerformanceMetricCard
                  title="Largest Contentful Paint"
                  value={webVitals.lcp}
                  threshold={2500}
                  unit="ms"
                  description="Measures loading performance. Good: < 2.5s"
                />
                <PerformanceMetricCard
                  title="First Input Delay"
                  value={webVitals.fid}
                  threshold={100}
                  unit="ms"
                  description="Measures interactivity. Good: < 100ms"
                />
                <PerformanceMetricCard
                  title="Cumulative Layout Shift"
                  value={webVitals.cls}
                  threshold={0.1}
                  unit=""
                  description="Measures visual stability. Good: < 0.1"
                />
                <PerformanceMetricCard
                  title="First Contentful Paint"
                  value={webVitals.fcp}
                  threshold={1800}
                  unit="ms"
                  description="Time until first content is rendered. Good: < 1.8s"
                />
              </div>

              {customMetrics.memoryUsage.length > 0 && (
                <PerformanceChart
                  data={customMetrics.memoryUsage.map(usage => ({
                    timestamp: usage.timestamp,
                    value: usage.usedJSHeapSize / (1024 * 1024)
                  }))}
                  title="Memory Usage Over Time"
                  unit="MB"
                  threshold={100}
                  height={200}
                />
              )}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PerformanceMetricCard
                  title="Average API Response"
                  value={averageApiResponse}
                  threshold={500}
                  unit="ms"
                  description="Average time for API calls"
                />
                <PerformanceMetricCard
                  title="Search Performance"
                  value={averageSearchResponse}
                  threshold={100}
                  unit="ms"
                  description="Average search response time"
                />
              </div>

              {customMetrics.searchResponseTimes.length > 0 && (
                <PerformanceChart
                  data={customMetrics.searchResponseTimes.map((time, index) => ({
                    timestamp: Date.now() - (customMetrics.searchResponseTimes.length - index) * 1000,
                    value: time
                  }))}
                  title="Search Response Times"
                  unit="ms"
                  threshold={100}
                  height={200}
                />
              )}

              {Object.keys(customMetrics.apiResponseTimes).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">API Endpoint Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(customMetrics.apiResponseTimes).map(([endpoint, times]) => {
                      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
                      return (
                        <PerformanceMetricCard
                          key={endpoint}
                          title={endpoint}
                          value={avgTime}
                          threshold={500}
                          unit="ms"
                          description={`${times.length} calls`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <PerformanceAlerts alerts={getLatestAlerts(20)} />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Performance Reports</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Generate detailed performance reports for analysis
                </p>
                <Button onClick={handleExportReport} icon={Download}>
                  Generate Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
