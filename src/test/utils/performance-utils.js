/**
 * Performance Testing Utilities
 * Provides tools for measuring and testing performance in the Birch Lounge app
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

/**
 * Measure Web Vitals for performance testing
 * @returns {Promise<Object>} Web vitals metrics
 */
export const measureWebVitals = () => {
  return new Promise((resolve) => {
    const metrics = {};
    let metricsCollected = 0;
    const totalMetrics = 5;

    const collectMetric = (name, value) => {
      metrics[name] = value;
      metricsCollected++;
      if (metricsCollected === totalMetrics) {
        resolve(metrics);
      }
    };

    getCLS(({ value }) => collectMetric('CLS', value));
    getFID(({ value }) => collectMetric('FID', value));
    getFCP(({ value }) => collectMetric('FCP', value));
    getLCP(({ value }) => collectMetric('LCP', value));
    getTTFB(({ value }) => collectMetric('TTFB', value));

    // Timeout after 5 seconds if not all metrics are collected
    setTimeout(() => {
      if (metricsCollected < totalMetrics) {
        resolve(metrics);
      }
    }, 5000);
  });
};

/**
 * Performance benchmark for component rendering
 * @param {Function} renderFunction - Function that renders the component
 * @param {number} iterations - Number of iterations to run
 * @returns {Object} Performance metrics
 */
export const benchmarkComponentRender = async (renderFunction, iterations = 100) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await renderFunction();
    const end = performance.now();
    times.push(end - start);
  }

  const average = times.reduce((sum, time) => sum + time, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

  return {
    average,
    min,
    max,
    median,
    iterations,
    times
  };
};

/**
 * Memory usage measurement
 * @returns {Object} Memory usage information
 */
export const measureMemoryUsage = () => {
  if (performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
};

/**
 * Virtual scrolling performance test
 * @param {Array} items - Items to render
 * @param {Function} renderItem - Function to render each item
 * @returns {Object} Performance metrics
 */
export const benchmarkVirtualScrolling = async (items, renderItem) => {
  const start = performance.now();
  
  // Simulate virtual scrolling by rendering visible items
  const visibleItems = items.slice(0, 20); // Assume 20 visible items
  const renderPromises = visibleItems.map(renderItem);
  
  await Promise.all(renderPromises);
  
  const end = performance.now();
  
  return {
    totalItems: items.length,
    visibleItems: visibleItems.length,
    renderTime: end - start,
    itemsPerSecond: visibleItems.length / ((end - start) / 1000)
  };
};

/**
 * Search performance benchmark
 * @param {Array} data - Data to search through
 * @param {string} searchTerm - Term to search for
 * @param {Function} searchFunction - Search function to test
 * @returns {Object} Search performance metrics
 */
export const benchmarkSearch = (data, searchTerm, searchFunction) => {
  const start = performance.now();
  const results = searchFunction(data, searchTerm);
  const end = performance.now();

  return {
    searchTime: end - start,
    resultsCount: results.length,
    dataSize: data.length,
    searchTerm,
    itemsPerMs: data.length / (end - start)
  };
};

/**
 * Bundle size analysis helper
 * @returns {Object} Bundle information
 */
export const analyzeBundleSize = () => {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  return {
    scriptCount: scripts.length,
    styleCount: styles.length,
    scripts: scripts.map(script => ({
      src: script.src,
      async: script.async,
      defer: script.defer
    })),
    styles: styles.map(style => ({
      href: style.href,
      media: style.media
    }))
  };
};

/**
 * Performance assertion helpers for tests
 */
export const performanceAssertions = {
  /**
   * Assert that render time is under threshold
   * @param {number} renderTime - Actual render time in ms
   * @param {number} threshold - Maximum allowed time in ms
   */
  expectRenderTimeUnder: (renderTime, threshold = 16) => {
    if (renderTime > threshold) {
      throw new Error(`Render time ${renderTime}ms exceeds threshold ${threshold}ms`);
    }
  },

  /**
   * Assert that search time is under threshold
   * @param {number} searchTime - Actual search time in ms
   * @param {number} threshold - Maximum allowed time in ms
   */
  expectSearchTimeUnder: (searchTime, threshold = 100) => {
    if (searchTime > threshold) {
      throw new Error(`Search time ${searchTime}ms exceeds threshold ${threshold}ms`);
    }
  },

  /**
   * Assert that memory usage is reasonable
   * @param {Object} memoryUsage - Memory usage object
   * @param {number} maxPercentage - Maximum allowed usage percentage
   */
  expectMemoryUsageUnder: (memoryUsage, maxPercentage = 80) => {
    if (memoryUsage && memoryUsage.usagePercentage > maxPercentage) {
      throw new Error(`Memory usage ${memoryUsage.usagePercentage}% exceeds threshold ${maxPercentage}%`);
    }
  }
};
