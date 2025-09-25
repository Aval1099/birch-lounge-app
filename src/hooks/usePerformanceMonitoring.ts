// =============================================================================
// PERFORMANCE MONITORING HOOK
// =============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  WebVitals,
  CustomMetrics,
  PerformanceAlert,
  PerformanceSession,
  PerformanceConfig
} from '../types/performance';
import { performanceMonitor } from '../services/performanceService';

/**
 * Hook for performance monitoring integration
 */
export const usePerformanceMonitoring = (config?: Partial<PerformanceConfig>) => {
  const [webVitals, setWebVitals] = useState<WebVitals>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null
  });

  const [customMetrics, setCustomMetrics] = useState<CustomMetrics>({
    apiResponseTimes: {},
    componentRenderTimes: {},
    searchResponseTimes: [],
    modalTimes: { open: [], close: [] },
    navigationTimes: {},
    memoryUsage: [],
    bundleLoadTimes: {}
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [currentSession, setCurrentSession] = useState<PerformanceSession | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const sessionIdRef = useRef<string | null>(null);

  // Initialize performance monitoring
  useEffect(() => {
    // Only initialize once per session
    if (!sessionIdRef.current) {
      performanceMonitor.initialize(config);
      setIsMonitoring(true);
      sessionIdRef.current = 'initialized';
    }

    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe((metric, value) => {
      switch (metric) {
        case 'lcp':
        case 'fid':
        case 'cls':
        case 'fcp':
        case 'ttfb':
        case 'inp':
          setWebVitals(prev => ({ ...prev, [metric]: value }));
          break;

        case 'alert':
          setAlerts(performanceMonitor.getAlerts());
          break;

        case 'sessionStart':
          setCurrentSession(performanceMonitor.getCurrentSession());
          break;

        case 'sessionEnd':
          setCurrentSession(null);
          break;

        default:
          // Update custom metrics for other metrics
          setCustomMetrics(performanceMonitor.getCustomMetrics());
          break;
      }
    });

    // Start initial session
    sessionIdRef.current = performanceMonitor.startSession();

    return () => {
      unsubscribe();
      if (sessionIdRef.current && sessionIdRef.current !== 'initialized') {
        performanceMonitor.endSession(sessionIdRef.current);
      }
      setIsMonitoring(false);
    };
  }, []); // Empty dependency array - only initialize once

  // Record custom metrics
  const recordMetric = useCallback((metric: string, value: number, details?: any) => {
    performanceMonitor.recordMetric(metric, value, details);
  }, []);

  // Measure component render time
  const measureRender = useCallback((componentName: string) => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      recordMetric('componentRender', renderTime, { component: componentName });
    };
  }, [recordMetric]);

  // Measure API response time
  const measureApiCall = useCallback((endpoint: string) => {
    const startTime = performance.now();

    return () => {
      const responseTime = performance.now() - startTime;
      recordMetric('apiResponse', responseTime, { endpoint });
    };
  }, [recordMetric]);

  // Measure search response time
  const measureSearch = useCallback(() => {
    const startTime = performance.now();

    return () => {
      const searchTime = performance.now() - startTime;
      recordMetric('searchResponse', searchTime);
    };
  }, [recordMetric]);

  // Measure modal timing
  const measureModal = useCallback((action: 'open' | 'close') => {
    const startTime = performance.now();

    return () => {
      const modalTime = performance.now() - startTime;
      recordMetric(action === 'open' ? 'modalOpen' : 'modalClose', modalTime);
    };
  }, [recordMetric]);

  // Measure navigation timing
  const measureNavigation = useCallback((tab: string) => {
    const startTime = performance.now();

    return () => {
      const navigationTime = performance.now() - startTime;
      recordMetric('navigation', navigationTime, { tab });
    };
  }, [recordMetric]);

  // Get performance score based on Web Vitals
  const getPerformanceScore = useCallback((): number => {
    const scores: number[] = [];

    // LCP score (0-100)
    if (webVitals.lcp !== null) {
      if (webVitals.lcp <= 2500) scores.push(100);
      else if (webVitals.lcp <= 4000) scores.push(50);
      else scores.push(0);
    }

    // FID score (0-100)
    if (webVitals.fid !== null) {
      if (webVitals.fid <= 100) scores.push(100);
      else if (webVitals.fid <= 300) scores.push(50);
      else scores.push(0);
    }

    // CLS score (0-100)
    if (webVitals.cls !== null) {
      if (webVitals.cls <= 0.1) scores.push(100);
      else if (webVitals.cls <= 0.25) scores.push(50);
      else scores.push(0);
    }

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }, [webVitals]);

  // Get latest alerts
  const getLatestAlerts = useCallback((count: number = 5): PerformanceAlert[] => {
    return alerts.slice(-count).reverse();
  }, [alerts]);

  // Clear all performance data
  const clearData = useCallback(() => {
    performanceMonitor.clearData();
    setAlerts([]);
    setCustomMetrics({
      apiResponseTimes: {},
      componentRenderTimes: {},
      searchResponseTimes: [],
      modalTimes: { open: [], close: [] },
      navigationTimes: {},
      memoryUsage: [],
      bundleLoadTimes: {}
    });
  }, []);

  // Generate performance report
  const generateReport = useCallback((timeRange?: { start: number; end: number }) => {
    return performanceMonitor.generateReport(timeRange);
  }, []);

  return {
    // State
    webVitals,
    customMetrics,
    alerts,
    currentSession,
    isMonitoring,

    // Measurement functions
    recordMetric,
    measureRender,
    measureApiCall,
    measureSearch,
    measureModal,
    measureNavigation,

    // Utility functions
    getPerformanceScore,
    getLatestAlerts,
    clearData,
    generateReport
  };
};

/**
 * Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const { measureRender } = usePerformanceMonitoring();
  const endMeasurement = useRef<(() => void) | null>(null);

  useEffect(() => {
    endMeasurement.current = measureRender(componentName);

    return () => {
      if (endMeasurement.current) {
        endMeasurement.current();
      }
    };
  }, [componentName, measureRender]);
};

/**
 * Hook for measuring API call performance
 */
export const useApiPerformance = () => {
  const { measureApiCall } = usePerformanceMonitoring();

  const measureCall = useCallback(async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const endMeasurement = measureApiCall(endpoint);

    try {
      const result = await apiCall();
      endMeasurement();
      return result;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  }, [measureApiCall]);

  return { measureCall };
};

/**
 * Hook for measuring search performance
 */
export const useSearchPerformance = () => {
  const { measureSearch } = usePerformanceMonitoring();

  const measureSearchCall = useCallback(<T>(
    searchFunction: () => T
  ): T => {
    const endMeasurement = measureSearch();
    const result = searchFunction();
    endMeasurement();
    return result;
  }, [measureSearch]);

  return { measureSearchCall };
};
