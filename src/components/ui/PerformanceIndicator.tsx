import React, { useState } from 'react';
import { Activity, AlertTriangle, Gauge, TrendingUp } from 'lucide-react';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import Button from './Button';
import { PerformanceDashboard } from '../features/PerformanceDashboard';

interface PerformanceIndicatorProps {
  className?: string;
  showScore?: boolean;
  showAlerts?: boolean;
}

/**
 * Performance Indicator Component
 * Shows real-time performance status in the main app
 */
export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  className = '',
  showScore = true,
  showAlerts = true
}) => {
  const [showDashboard, setShowDashboard] = useState(false);

  const {
    isMonitoring,
    getPerformanceScore,
    getLatestAlerts
  } = usePerformanceMonitoring();

  const performanceScore = getPerformanceScore();
  const recentAlerts = getLatestAlerts(3);
  const criticalAlerts = recentAlerts.filter(alert => alert.level === 'poor');

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Get score background
  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 70) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const getStatusIcon = () => {
    if (!isMonitoring) {
      return <Activity className="w-4 h-4 text-gray-400" />;
    }

    if (criticalAlerts.length > 0) {
      return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
    }

    if (performanceScore >= 90) {
      return <Gauge className="w-4 h-4 text-green-500" />;
    }

    if (performanceScore >= 70) {
      return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    }

    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (!isMonitoring) return 'Monitoring Disabled';

    if (criticalAlerts.length > 0) {
      return `${criticalAlerts.length} Critical Issue${criticalAlerts.length > 1 ? 's' : ''}`;
    }

    if (performanceScore >= 90) return 'Excellent';
    if (performanceScore >= 70) return 'Good';
    if (performanceScore >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  if (!isMonitoring && !showScore) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Status Icon */}
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
            {getStatusText()}
          </span>
        </div>

        {/* Performance Score */}
        {showScore && performanceScore > 0 && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBg(performanceScore)}`}>
            <span className={getScoreColor(performanceScore)}>
              {Math.round(performanceScore)}
            </span>
          </div>
        )}

        {/* Alert Count */}
        {showAlerts && criticalAlerts.length > 0 && (
          <div className="relative">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
              {criticalAlerts.length}
            </div>
          </div>
        )}

        {/* Dashboard Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDashboard(true)}
          className="text-xs px-2 py-1"
          title="Open Performance Dashboard"
        >
          <Activity className="w-3 h-3" />
        </Button>
      </div>

      {/* Performance Dashboard Modal */}
      <PerformanceDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        showRealTime={true}
        showAlerts={true}
        showReports={true}
      />
    </>
  );
};
