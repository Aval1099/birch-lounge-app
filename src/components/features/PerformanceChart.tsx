import React, { useMemo } from 'react';
import type { PerformanceChartProps } from '../../types/performance';

/**
 * Performance Chart Component
 * Simple SVG-based chart for performance metrics visualization
 */
export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title,
  unit,
  threshold,
  height = 200,
  className = ''
}) => {
  const chartData = useMemo(() => {
    if (data.length === 0) return { points: '', maxValue: 0, minValue: 0, width: 400 };

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, threshold || 0);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    // Create SVG path points
    const width = 400;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + ((maxValue - point.value) / range) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return { points, maxValue, minValue, width, chartHeight: height };
  }, [data, threshold, height]);

  const formatValue = (value: number) => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === 'MB') {
      return `${value.toFixed(1)}MB`;
    }
    return `${Math.round(value)}${unit}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (data.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const latestValue = data[data.length - 1]?.value || 0;
  const isAboveThreshold = threshold && latestValue > threshold;

  return (
    <div className={`p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            isAboveThreshold
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'
          }`}>
            {formatValue(latestValue)}
          </div>
          {threshold && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Threshold: {formatValue(threshold)}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${chartData.width} ${chartData.chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-gray-200 dark:text-gray-700"
              />
            </pattern>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="url(#grid)"
            opacity="0.3"
          />

          {/* Threshold line */}
          {threshold && (
            <line
              x1="20"
              y1={20 + ((chartData.maxValue - threshold) / (chartData.maxValue - chartData.minValue)) * (height - 40)}
              x2={chartData.width - 20}
              y2={20 + ((chartData.maxValue - threshold) / (chartData.maxValue - chartData.minValue)) * (height - 40)}
              stroke="rgb(239 68 68)"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}

          {/* Data line */}
          <polyline
            points={chartData.points}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = 20 + (index / (data.length - 1)) * (chartData.width - 40);
            const y = 20 + ((chartData.maxValue - point.value) / (chartData.maxValue - chartData.minValue)) * (height - 40);

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill="rgb(59 130 246)"
                  className="hover:r-4 transition-all duration-200"
                />

                {/* Tooltip on hover */}
                <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                  <rect
                    x={x - 40}
                    y={y - 35}
                    width="80"
                    height="25"
                    fill="rgb(17 24 39)"
                    rx="4"
                    opacity="0.9"
                  />
                  <text
                    x={x}
                    y={y - 20}
                    textAnchor="middle"
                    className="text-xs fill-white"
                  >
                    {formatValue(point.value)}
                  </text>
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-xs fill-gray-300"
                  >
                    {formatTime(point.timestamp)}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{formatTime(data[0]?.timestamp || Date.now())}</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Value</span>
          </div>
          {threshold && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500 border-dashed"></div>
              <span>Threshold</span>
            </div>
          )}
        </div>
        <span>{formatTime(data[data.length - 1]?.timestamp || Date.now())}</span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(Math.min(...data.map(d => d.value)))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Min</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatValue(Math.max(...data.map(d => d.value)))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
        </div>
      </div>
    </div>
  );
};
