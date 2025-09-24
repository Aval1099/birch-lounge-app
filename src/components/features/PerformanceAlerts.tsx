import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { PerformanceAlert } from '../../types/performance';
import Button from '../ui/Button';

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[];
  onDismiss?: (alertId: string) => void;
  showSuggestions?: boolean;
}

/**
 * Performance Alerts Component
 * Displays performance alerts with suggestions and actions
 */
export const PerformanceAlerts: React.FC<PerformanceAlertsProps> = ({
  alerts,
  onDismiss,
  showSuggestions = true
}) => {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'poor' | 'needs-improvement'>('all');

  const toggleExpanded = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'poor':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'needs-improvement':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      default:
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (metric.includes('time') || metric === 'lcp' || metric === 'fid' || metric === 'fcp' || metric === 'ttfb') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (metric === 'cls') {
      return value.toFixed(3);
    }
    if (metric.includes('memory')) {
      return `${(value / (1024 * 1024)).toFixed(1)}MB`;
    }
    return Math.round(value).toString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.level === filter;
  });

  const alertCounts = {
    poor: alerts.filter(a => a.level === 'poor').length,
    'needs-improvement': alerts.filter(a => a.level === 'needs-improvement').length,
    good: alerts.filter(a => a.level === 'good').length
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Performance Issues
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          All performance metrics are within acceptable ranges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {alertCounts.poor}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">Poor</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {alertCounts['needs-improvement']}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Needs Improvement</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {alertCounts.good}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Good</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </Button>
        <Button
          variant={filter === 'poor' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('poor')}
        >
          Poor ({alertCounts.poor})
        </Button>
        <Button
          variant={filter === 'needs-improvement' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setFilter('needs-improvement')}
        >
          Needs Improvement ({alertCounts['needs-improvement']})
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-2 ${getAlertColor(alert.level)}`}
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getAlertIcon(alert.level)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {alert.message}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      alert.level === 'poor'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : alert.level === 'needs-improvement'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {alert.level.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      Value: {formatValue(alert.value, alert.metric)}
                    </span>
                    <span>
                      Threshold: {formatValue(alert.threshold, alert.metric)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(alert.timestamp)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {alert.suggestions.length > 0 && showSuggestions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(alert.id)}
                    icon={expandedAlerts.has(alert.id) ? ChevronUp : ChevronDown}
                  >
                    {expandedAlerts.has(alert.id) ? 'Hide' : 'Show'} Suggestions
                  </Button>
                )}

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismiss(alert.id)}
                    icon={X}
                    className="text-gray-400 hover:text-gray-600"
                  />
                )}
              </div>
            </div>

            {/* Suggestions */}
            {expandedAlerts.has(alert.id) && alert.suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    Improvement Suggestions
                  </h5>
                </div>

                <ul className="space-y-2">
                  {alert.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            No alerts found for the selected filter.
          </div>
        </div>
      )}
    </div>
  );
};
