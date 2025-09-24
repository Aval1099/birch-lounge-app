import { test, expect } from '@playwright/test';

test.describe('Application Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that the main app container is visible
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    
    // Check that the navigation tabs are present
    await expect(page.locator('[data-testid="tab-recipes"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-ingredients"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-techniques"]')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Start on recipes tab (default)
    await expect(page.locator('[data-testid="recipes-content"]')).toBeVisible();
    
    // Navigate to ingredients tab
    await page.click('[data-testid="tab-ingredients"]');
    await expect(page.locator('[data-testid="ingredients-content"]')).toBeVisible();
    
    // Navigate to techniques tab
    await page.click('[data-testid="tab-techniques"]');
    await expect(page.locator('[data-testid="techniques-content"]')).toBeVisible();
    
    // Navigate back to recipes tab
    await page.click('[data-testid="tab-recipes"]');
    await expect(page.locator('[data-testid="recipes-content"]')).toBeVisible();
  });

  test('should toggle theme', async ({ page }) => {
    // Check initial theme (should be light by default)
    const body = page.locator('body');
    await expect(body).not.toHaveClass(/dark/);
    
    // Toggle to dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(body).toHaveClass(/dark/);
    
    // Toggle back to light theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(body).not.toHaveClass(/dark/);
  });

  test('should toggle service mode', async ({ page }) => {
    // Check initial state (service mode off)
    await expect(page.locator('[data-testid="service-mode-indicator"]')).not.toBeVisible();
    
    // Toggle service mode on
    await page.click('[data-testid="service-mode-toggle"]');
    await expect(page.locator('[data-testid="service-mode-indicator"]')).toBeVisible();
    
    // Toggle service mode off
    await page.click('[data-testid="service-mode-toggle"]');
    await expect(page.locator('[data-testid="service-mode-indicator"]')).not.toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check that mobile navigation is visible
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      
      // Check that desktop navigation is hidden
      await expect(page.locator('[data-testid="desktop-navigation"]')).not.toBeVisible();
      
      // Test mobile tab navigation
      await page.click('[data-testid="mobile-tab-ingredients"]');
      await expect(page.locator('[data-testid="ingredients-content"]')).toBeVisible();
    } else {
      // Check that desktop navigation is visible
      await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible();
      
      // Check that mobile navigation is hidden
      await expect(page.locator('[data-testid="mobile-navigation"]')).not.toBeVisible();
    }
  });

  test('should persist theme preference', async ({ page }) => {
    // Set dark theme
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Check that dark theme is still active
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first tab
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="tab-recipes"]')).toBeFocused();
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-testid="tab-ingredients"]')).toBeFocused();
    
    // Activate tab with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="ingredients-content"]')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    // Check for loading indicators during initial load
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Should show loading state initially
    const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Loading indicator should be gone
    await expect(loadingIndicator).not.toBeVisible();
  });
});
