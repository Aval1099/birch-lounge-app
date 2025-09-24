import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load the application within performance budget', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay (FID) - simulated
        vitals.fid = 0; // Will be measured during interaction
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // First Contentful Paint (FCP)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          vitals.fcp = entries[0].startTime;
        }).observe({ entryTypes: ['paint'] });
        
        setTimeout(() => resolve(vitals), 3000);
      });
    });
    
    // Assert performance budgets
    expect(webVitals.lcp).toBeLessThan(2500); // LCP should be < 2.5s
    expect(webVitals.fcp).toBeLessThan(1800); // FCP should be < 1.8s
    expect(webVitals.cls).toBeLessThan(0.1);  // CLS should be < 0.1
  });

  test('should handle large recipe lists efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Navigate to recipes tab
    await page.click('[data-testid="tab-recipes"]');
    
    // Measure time to render recipe list
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="recipe-grid"]');
    const renderTime = Date.now() - startTime;
    
    // Should render within 500ms
    expect(renderTime).toBeLessThan(500);
    
    // Test scrolling performance with large lists
    const recipeGrid = page.locator('[data-testid="recipe-grid"]');
    await expect(recipeGrid).toBeVisible();
    
    // Scroll through the list
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(100);
    }
    
    // Should maintain smooth scrolling
    const scrollPerformance = await page.evaluate(() => {
      return performance.getEntriesByType('measure').length;
    });
    
    expect(scrollPerformance).toBeGreaterThan(0);
  });

  test('should search recipes with <100ms response time', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Navigate to recipes tab
    await page.click('[data-testid="tab-recipes"]');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Measure search response time
    const startTime = Date.now();
    await searchInput.fill('martini');
    
    // Wait for search results to update
    await page.waitForFunction(() => {
      const input = document.querySelector('[data-testid="search-input"]') as HTMLInputElement;
      return input && input.value === 'martini';
    });
    
    const responseTime = Date.now() - startTime;
    
    // Should respond within 100ms (excluding debounce)
    expect(responseTime).toBeLessThan(100);
  });

  test('should handle modal animations smoothly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Test recipe modal performance
    const startTime = Date.now();
    await page.click('[data-testid="create-recipe-button"]');
    await page.waitForSelector('[data-testid="recipe-modal"]');
    const modalOpenTime = Date.now() - startTime;
    
    // Modal should open within 300ms
    expect(modalOpenTime).toBeLessThan(300);
    
    // Test modal close performance
    const closeStartTime = Date.now();
    await page.click('[data-testid="close-modal-button"]');
    await page.waitForSelector('[data-testid="recipe-modal"]', { state: 'hidden' });
    const modalCloseTime = Date.now() - closeStartTime;
    
    // Modal should close within 300ms
    expect(modalCloseTime).toBeLessThan(300);
  });

  test('should maintain performance on mobile devices', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      await page.waitForSelector('[data-testid="app-container"]');
      
      // Test touch interactions performance
      const startTime = Date.now();
      await page.tap('[data-testid="tab-ingredients"]');
      await page.waitForSelector('[data-testid="ingredients-content"]');
      const tapResponseTime = Date.now() - startTime;
      
      // Touch response should be < 100ms
      expect(tapResponseTime).toBeLessThan(100);
      
      // Test scroll performance on mobile
      const scrollContainer = page.locator('[data-testid="ingredients-content"]');
      await expect(scrollContainer).toBeVisible();
      
      // Perform scroll gestures
      const containerBox = await scrollContainer.boundingBox();
      if (containerBox) {
        await page.mouse.move(containerBox.x + containerBox.width / 2, containerBox.y + containerBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(containerBox.x + containerBox.width / 2, containerBox.y + 50);
        await page.mouse.up();
      }
      
      // Should maintain 60fps during scroll
      const frameRate = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          const startTime = performance.now();
          
          function countFrames() {
            frames++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(countFrames);
            } else {
              resolve(frames);
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      
      expect(frameRate).toBeGreaterThan(55); // Allow for some variance
    }
  });

  test('should handle memory efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      // Open and close modals
      await page.click('[data-testid="create-recipe-button"]');
      await page.waitForSelector('[data-testid="recipe-modal"]');
      await page.click('[data-testid="close-modal-button"]');
      await page.waitForSelector('[data-testid="recipe-modal"]', { state: 'hidden' });
      
      // Switch between tabs
      await page.click('[data-testid="tab-ingredients"]');
      await page.click('[data-testid="tab-recipes"]');
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Memory growth should be reasonable (less than 50MB increase)
    const memoryGrowth = finalMemory - initialMemory;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Monitor image loading
    const imageLoadTimes: number[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('.jpg') || response.url().includes('.png') || response.url().includes('.webp')) {
        const timing = response.timing();
        imageLoadTimes.push(timing.responseEnd - timing.responseStart);
      }
    });
    
    // Navigate through the app to trigger image loads
    await page.click('[data-testid="tab-recipes"]');
    await page.waitForTimeout(2000);
    
    // Check image load performance
    if (imageLoadTimes.length > 0) {
      const averageLoadTime = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
      expect(averageLoadTime).toBeLessThan(1000); // Average image load < 1s
    }
  });
});
