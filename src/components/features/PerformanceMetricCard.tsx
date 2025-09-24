import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import type { PerformanceMetricCardProps } from '../../types/performance';

/**
 * Performance Metric Card Component
 * Displays individual performance metrics with visual indicators
 */
export const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  threshold,
  unit,
  description,
  trend,
  className = ''
}) => {
  // Determine status based on value and threshold
  const getStatus = () => {
    if (value === null) return 'unknown';
    
    // For CLS, lower is better
    if (title.toLowerCase().includes('shift')) {
      if (value <= threshold) return 'good';
      if (value <= threshold * 2.5) return 'needs-improvement';
      return 'poor';
    }
    
    // For other metrics, lower is generally better
    if (value <= threshold) return 'good';
    if (value <= threshold * 2) return 'needs-improvement';
    return 'poor';
  };

  const status = getStatus();

  // Get status colors
  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'needs-improvement':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'poor':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'good':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'needs-improvement':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'poor':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'needs-improvement':
      case 'poor':
        return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatValue = (val: number | null) => {
    if (val === null) return 'N/A';
    
    if (unit === 'ms') {
      return val < 1000 ? `${Math.round(val)}ms` : `${(val / 1000).toFixed(1)}s`;
    }
    
    if (unit === 'MB') {
      return `${val.toFixed(1)}MB`;
    }
    
    if (unit === '') {
      return val.toFixed(3);
    }
    
    return `${Math.round(val)}${unit}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'good':
        return 'Good';
      case 'needs-improvement':
        return 'Needs Improvement';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusBg()} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {title}
          </h3>
        </div>
        {getTrendIcon()}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className={`text-2xl font-bold ${getStatusColor()}`}>
          {formatValue(value)}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Threshold: {formatValue(threshold)}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          status === 'good' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : status === 'needs-improvement'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
            : status === 'poor'
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {getStatusText()}
        </span>
      </div>

      {/* Description */}
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {description}
      </div>

      {/* Progress Bar */}
      {value !== null && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                status === 'good'
                  ? 'bg-green-500'
                  : status === 'needs-improvement'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(100, (value / (threshold * 2)) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
