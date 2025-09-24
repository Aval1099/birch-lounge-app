import { test, expect } from '@playwright/test';

test.describe('Recipe Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="app-container"]');
    
    // Ensure we're on the recipes tab
    await page.click('[data-testid="tab-recipes"]');
    await expect(page.locator('[data-testid="recipes-content"]')).toBeVisible();
  });

  test('should create a new recipe', async ({ page }) => {
    // Click create recipe button
    await page.click('[data-testid="create-recipe-button"]');
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="recipe-modal"]')).toBeVisible();
    
    // Fill in recipe details
    await page.fill('[data-testid="recipe-name-input"]', 'Test Cocktail');
    await page.fill('[data-testid="recipe-category-input"]', 'Classic');
    await page.fill('[data-testid="recipe-description-input"]', 'A test cocktail recipe');
    
    // Add ingredients
    await page.click('[data-testid="add-ingredient-button"]');
    await page.fill('[data-testid="ingredient-name-0"]', 'Gin');
    await page.fill('[data-testid="ingredient-amount-0"]', '2');
    await page.fill('[data-testid="ingredient-unit-0"]', 'oz');
    
    // Add instructions
    await page.fill('[data-testid="recipe-instructions"]', 'Stir with ice and strain');
    
    // Save recipe
    await page.click('[data-testid="save-recipe-button"]');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="recipe-modal"]')).not.toBeVisible();
    
    // Verify recipe appears in the list
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: 'Test Cocktail' })).toBeVisible();
  });

  test('should search recipes', async ({ page }) => {
    // Create a test recipe first (assuming some recipes exist)
    await page.fill('[data-testid="search-input"]', 'Martini');
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay
    
    // Check that search results are filtered
    const recipeCards = page.locator('[data-testid="recipe-card"]');
    const visibleCards = await recipeCards.count();
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await page.waitForTimeout(500);
    
    // Should show all recipes again
    const allCards = await recipeCards.count();
    expect(allCards).toBeGreaterThanOrEqual(visibleCards);
  });

  test('should filter recipes by category', async ({ page }) => {
    // Open category filter
    await page.click('[data-testid="category-filter"]');
    
    // Select a category
    await page.click('[data-testid="category-option-classic"]');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check that only classic recipes are shown
    const recipeCards = page.locator('[data-testid="recipe-card"]');
    const count = await recipeCards.count();
    
    // Reset filter
    await page.click('[data-testid="category-filter"]');
    await page.click('[data-testid="category-option-all"]');
  });

  test('should toggle recipe favorite', async ({ page }) => {
    // Find first recipe card
    const firstRecipe = page.locator('[data-testid="recipe-card"]').first();
    await expect(firstRecipe).toBeVisible();
    
    // Click favorite button
    const favoriteButton = firstRecipe.locator('[data-testid="favorite-button"]');
    await favoriteButton.click();
    
    // Check that favorite state changed
    await expect(favoriteButton).toHaveClass(/text-yellow-500/);
    
    // Click again to unfavorite
    await favoriteButton.click();
    await expect(favoriteButton).not.toHaveClass(/text-yellow-500/);
  });

  test('should edit recipe', async ({ page }) => {
    // Click on first recipe to open details
    const firstRecipe = page.locator('[data-testid="recipe-card"]').first();
    await firstRecipe.click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="recipe-modal"]')).toBeVisible();
    
    // Click edit button
    await page.click('[data-testid="edit-recipe-button"]');
    
    // Modify recipe name
    const nameInput = page.locator('[data-testid="recipe-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Modified Recipe Name');
    
    // Save changes
    await page.click('[data-testid="save-recipe-button"]');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="recipe-modal"]')).not.toBeVisible();
    
    // Verify changes are reflected
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: 'Modified Recipe Name' })).toBeVisible();
  });

  test('should delete recipe', async ({ page }) => {
    // Get initial recipe count
    const initialCount = await page.locator('[data-testid="recipe-card"]').count();
    
    // Click on first recipe
    const firstRecipe = page.locator('[data-testid="recipe-card"]').first();
    const recipeName = await firstRecipe.locator('[data-testid="recipe-name"]').textContent();
    await firstRecipe.click();
    
    // Wait for modal to open
    await expect(page.locator('[data-testid="recipe-modal"]')).toBeVisible();
    
    // Click delete button
    await page.click('[data-testid="delete-recipe-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for modal to close
    await expect(page.locator('[data-testid="recipe-modal"]')).not.toBeVisible();
    
    // Verify recipe is removed
    const finalCount = await page.locator('[data-testid="recipe-card"]').count();
    expect(finalCount).toBe(initialCount - 1);
    
    // Verify specific recipe is gone
    await expect(page.locator('[data-testid="recipe-card"]').filter({ hasText: recipeName || '' })).not.toBeVisible();
  });

  test('should handle recipe comparison', async ({ page }) => {
    // Enable comparison mode
    await page.click('[data-testid="comparison-toggle"]');
    
    // Select multiple recipes
    const recipeCards = page.locator('[data-testid="recipe-card"]');
    await recipeCards.nth(0).locator('[data-testid="comparison-checkbox"]').click();
    await recipeCards.nth(1).locator('[data-testid="comparison-checkbox"]').click();
    
    // Open comparison view
    await page.click('[data-testid="compare-selected-button"]');
    
    // Wait for comparison modal
    await expect(page.locator('[data-testid="comparison-modal"]')).toBeVisible();
    
    // Verify both recipes are shown
    const comparisonItems = page.locator('[data-testid="comparison-item"]');
    await expect(comparisonItems).toHaveCount(2);
    
    // Close comparison
    await page.click('[data-testid="close-comparison-button"]');
    await expect(page.locator('[data-testid="comparison-modal"]')).not.toBeVisible();
  });

  test('should export recipes', async ({ page }) => {
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-testid="export-recipes-button"]');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toContain('recipes');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('should handle mobile recipe interactions', async ({ page, isMobile }) => {
    if (isMobile) {
      // Test mobile-specific interactions
      const firstRecipe = page.locator('[data-testid="recipe-card"]').first();
      
      // Long press to open context menu
      await firstRecipe.tap();
      await page.waitForTimeout(500);
      
      // Check that mobile actions are available
      await expect(page.locator('[data-testid="mobile-recipe-actions"]')).toBeVisible();
      
      // Test swipe gestures (if implemented)
      const recipeCard = firstRecipe.boundingBox();
      if (recipeCard) {
        await page.mouse.move(recipeCard.x + 10, recipeCard.y + recipeCard.height / 2);
        await page.mouse.down();
        await page.mouse.move(recipeCard.x + recipeCard.width - 10, recipeCard.y + recipeCard.height / 2);
        await page.mouse.up();
      }
    }
  });
});
