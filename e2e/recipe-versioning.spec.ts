/**
 * Recipe Versioning E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Recipe Versioning', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to load
    await expect(page.locator('[data-testid="main-app"]')).toBeVisible();
    
    // Create a base recipe for testing
    await page.click('[data-testid="add-recipe-button"]');
    await page.fill('[data-testid="recipe-name-input"]', 'Test Gin & Tonic');
    await page.selectOption('[data-testid="recipe-category-select"]', 'Highball');
    
    // Add ingredients
    await page.fill('[data-testid="ingredient-name-0"]', 'Gin');
    await page.fill('[data-testid="ingredient-amount-0"]', '2');
    await page.selectOption('[data-testid="ingredient-unit-0"]', 'oz');
    
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-1"]', 'Tonic Water');
    await page.fill('[data-testid="ingredient-amount-1"]', '4');
    await page.selectOption('[data-testid="ingredient-unit-1"]', 'oz');
    
    // Add instructions
    await page.fill('[data-testid="recipe-instructions"]', 'Add gin to glass with ice. Top with tonic water. Stir gently.');
    
    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    await expect(page.locator('[data-testid="recipe-modal"]')).not.toBeVisible();
  });

  test('should create a new recipe version', async ({ page }) => {
    // Open the recipe for editing
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    
    // Look for version controls
    await expect(page.locator('[data-testid="version-selector"]')).toBeVisible();
    
    // Click create version button
    await page.click('[data-testid="create-version-button"]');
    
    // Fill version creation form
    await expect(page.locator('[data-testid="create-version-modal"]')).toBeVisible();
    
    await page.selectOption('[data-testid="version-type-select"]', 'variation');
    await page.fill('[data-testid="version-name-input"]', 'Low ABV Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Reduced gin amount for lower alcohol content');
    
    // Modify the recipe
    await page.fill('[data-testid="ingredient-amount-0"]', '1.5');
    await page.fill('[data-testid="ingredient-amount-1"]', '4.5');
    
    // Create the version
    await page.click('[data-testid="create-version-submit"]');
    
    // Verify version was created
    await expect(page.locator('[data-testid="create-version-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="version-selector"]')).toContainText('Low ABV Version');
  });

  test('should display version selector with multiple versions', async ({ page }) => {
    // Create a version first (reuse previous test logic)
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    await page.click('[data-testid="create-version-button"]');
    
    await page.selectOption('[data-testid="version-type-select"]', 'variation');
    await page.fill('[data-testid="version-name-input"]', 'Citrus Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Added lime juice');
    
    // Add lime juice ingredient
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-2"]', 'Lime Juice');
    await page.fill('[data-testid="ingredient-amount-2"]', '0.5');
    await page.selectOption('[data-testid="ingredient-unit-2"]', 'oz');
    
    await page.click('[data-testid="create-version-submit"]');
    
    // Check version selector shows both versions
    await expect(page.locator('[data-testid="version-selector"]')).toBeVisible();
    
    // Open version dropdown
    await page.click('[data-testid="version-selector-dropdown"]');
    
    // Verify both versions are listed
    await expect(page.locator('[data-testid="version-option"]:has-text("Original")')).toBeVisible();
    await expect(page.locator('[data-testid="version-option"]:has-text("Citrus Version")')).toBeVisible();
    
    // Verify main version is marked
    await expect(page.locator('[data-testid="version-option"]:has-text("Original")').locator('[data-testid="main-badge"]')).toBeVisible();
  });

  test('should compare recipe versions', async ({ page }) => {
    // Create two versions first
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    
    // Create first variation
    await page.click('[data-testid="create-version-button"]');
    await page.selectOption('[data-testid="version-type-select"]', 'variation');
    await page.fill('[data-testid="version-name-input"]', 'Strong Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Increased gin amount');
    await page.fill('[data-testid="ingredient-amount-0"]', '2.5');
    await page.click('[data-testid="create-version-submit"]');
    
    // Create second variation
    await page.click('[data-testid="create-version-button"]');
    await page.selectOption('[data-testid="version-type-select"]', 'variation');
    await page.fill('[data-testid="version-name-input"]', 'Weak Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Decreased gin amount');
    await page.fill('[data-testid="ingredient-amount-0"]', '1');
    await page.click('[data-testid="create-version-submit"]');
    
    // Open comparison
    await page.click('[data-testid="compare-versions-button"]');
    
    // Select versions to compare
    await page.selectOption('[data-testid="compare-version-a-select"]', 'Strong Version');
    await page.selectOption('[data-testid="compare-version-b-select"]', 'Weak Version');
    
    await page.click('[data-testid="start-comparison-button"]');
    
    // Verify comparison modal opens
    await expect(page.locator('[data-testid="version-comparison-modal"]')).toBeVisible();
    
    // Check comparison content
    await expect(page.locator('[data-testid="comparison-similarity-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="ingredient-differences"]')).toBeVisible();
    
    // Verify ingredient changes are shown
    await expect(page.locator('[data-testid="ingredient-change"]:has-text("Gin")')).toBeVisible();
    
    // Check tabs work
    await page.click('[data-testid="comparison-tab-ingredients"]');
    await expect(page.locator('[data-testid="ingredient-comparison-section"]')).toBeVisible();
    
    await page.click('[data-testid="comparison-tab-overview"]');
    await expect(page.locator('[data-testid="comparison-overview-section"]')).toBeVisible();
  });

  test('should show version history', async ({ page }) => {
    // Create a version to generate history
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    await page.click('[data-testid="create-version-button"]');
    
    await page.selectOption('[data-testid="version-type-select"]', 'improvement');
    await page.fill('[data-testid="version-name-input"]', 'Improved Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Better mixing technique');
    await page.fill('[data-testid="recipe-instructions"]', 'Add gin to glass with ice. Top with tonic water. Stir vigorously for 10 seconds.');
    
    await page.click('[data-testid="create-version-submit"]');
    
    // Open version history
    await page.click('[data-testid="version-history-button"]');
    
    // Verify history panel is visible
    await expect(page.locator('[data-testid="version-history-panel"]')).toBeVisible();
    
    // Check history entries
    await expect(page.locator('[data-testid="history-entry"]')).toHaveCount.greaterThan(0);
    
    // Verify creation entry exists
    await expect(page.locator('[data-testid="history-entry"]:has-text("created")')).toBeVisible();
    
    // Check entry details
    const historyEntry = page.locator('[data-testid="history-entry"]').first();
    await expect(historyEntry.locator('[data-testid="history-action-badge"]')).toBeVisible();
    await expect(historyEntry.locator('[data-testid="history-timestamp"]')).toBeVisible();
  });

  test('should set main version', async ({ page }) => {
    // Create a version
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    await page.click('[data-testid="create-version-button"]');
    
    await page.selectOption('[data-testid="version-type-select"]', 'improvement');
    await page.fill('[data-testid="version-name-input"]', 'Better Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Improved recipe');
    
    await page.click('[data-testid="create-version-submit"]');
    
    // Open version actions menu
    await page.click('[data-testid="version-actions-menu"]');
    
    // Set as main version
    await page.click('[data-testid="set-main-version-action"]');
    
    // Confirm action
    await page.click('[data-testid="confirm-set-main-button"]');
    
    // Verify main version changed
    await expect(page.locator('[data-testid="version-selector"]')).toContainText('Better Version');
    await expect(page.locator('[data-testid="main-version-badge"]')).toBeVisible();
  });

  test('should archive a version', async ({ page }) => {
    // Create a version to archive
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    await page.click('[data-testid="create-version-button"]');
    
    await page.selectOption('[data-testid="version-type-select"]', 'variation');
    await page.fill('[data-testid="version-name-input"]', 'Experimental Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Testing new approach');
    
    await page.click('[data-testid="create-version-submit"]');
    
    // Select the new version
    await page.click('[data-testid="version-selector-dropdown"]');
    await page.click('[data-testid="version-option"]:has-text("Experimental Version")');
    
    // Archive the version
    await page.click('[data-testid="version-actions-menu"]');
    await page.click('[data-testid="archive-version-action"]');
    
    // Confirm archival
    await page.click('[data-testid="confirm-archive-button"]');
    
    // Verify version is archived
    await expect(page.locator('[data-testid="archived-version-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="version-status-badge"]:has-text("archived")')).toBeVisible();
  });

  test('should handle version creation errors', async ({ page }) => {
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    await page.click('[data-testid="create-version-button"]');
    
    // Try to create version without required fields
    await page.click('[data-testid="create-version-submit"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="version-name-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="change-description-error"]')).toBeVisible();
    
    // Fill required fields
    await page.fill('[data-testid="version-name-input"]', 'Valid Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Valid description');
    
    // Verify errors are cleared
    await expect(page.locator('[data-testid="version-name-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="change-description-error"]')).not.toBeVisible();
  });

  test('should support keyboard navigation in version selector', async ({ page }) => {
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    
    // Focus version selector
    await page.focus('[data-testid="version-selector-dropdown"]');
    
    // Open with Enter key
    await page.keyboard.press('Enter');
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    
    // Select with Enter
    await page.keyboard.press('Enter');
    
    // Verify dropdown closed
    await expect(page.locator('[data-testid="version-dropdown-menu"]')).not.toBeVisible();
  });

  test('should persist version data across page reloads', async ({ page }) => {
    // Create a version
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    await page.click('[data-testid="create-version-button"]');
    
    await page.selectOption('[data-testid="version-type-select"]', 'seasonal');
    await page.fill('[data-testid="version-name-input"]', 'Summer Version');
    await page.fill('[data-testid="change-description-textarea"]', 'Perfect for summer');
    
    await page.click('[data-testid="create-version-submit"]');
    
    // Reload the page
    await page.reload();
    await expect(page.locator('[data-testid="main-app"]')).toBeVisible();
    
    // Open the recipe again
    await page.click('[data-testid="recipe-card"]:has-text("Test Gin & Tonic")');
    
    // Verify version still exists
    await page.click('[data-testid="version-selector-dropdown"]');
    await expect(page.locator('[data-testid="version-option"]:has-text("Summer Version")')).toBeVisible();
  });
});
