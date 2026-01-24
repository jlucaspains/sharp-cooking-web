import { test, expect } from '@playwright/test';
import { setupTestRecipes, cleanupTestRecipes } from './helpers';

test.describe('Export Recipe Book - Selection UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await setupTestRecipes(page);
    // Navigate to export page
    await page.goto('http://localhost:3000/#/export-recipe-book');
    await page.waitForTimeout(500); // Allow recipes to load
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestRecipes(page);
  });

  test('should show export page with recipe list', async ({ page }) => {
    // Check page title
    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toBeVisible();
    
    // Check that recipes are displayed
    const recipeItems = page.locator('[role="checkbox"]');
    await expect(recipeItems.first()).toBeVisible();
  });

  test('should have back button that returns to recipe list', async ({ page }) => {
    // Find and click back button
    const backButton = page.getByRole('button', { name: /back/i });
    await expect(backButton).toBeVisible();
    
    await backButton.click();
    
    // Should be back on home page
    await expect(page).toHaveURL(/\/#\/$/);
  });

  test('should show Select All and Clear All buttons', async ({ page }) => {
    const selectAllButton = page.getByRole('button', { name: /select all/i });
    const clearAllButton = page.getByRole('button', { name: /clear all/i });
    
    await expect(selectAllButton).toBeVisible();
    await expect(clearAllButton).toBeVisible();
  });

  test('Select All button should select all recipes', async ({ page }) => {
    // Initially no recipes selected
    const selectedCountText = page.locator('text=/\\d+ recipes selected/');
    await expect(selectedCountText).toContainText('0 recipes selected');
    
    // Click Select All
    const selectAllButton = page.getByRole('button', { name: /select all/i });
    await selectAllButton.click();
    
    // Wait for update
    await page.waitForTimeout(200);
    
    // Should show count > 0
    const updatedCountText = await selectedCountText.textContent();
    expect(updatedCountText).not.toContain('0 recipes selected');
  });

  test('Clear All button should deselect all recipes', async ({ page }) => {
    // First select all
    const selectAllButton = page.getByRole('button', { name: /select all/i });
    await selectAllButton.click();
    await page.waitForTimeout(200);
    
    // Verify some recipes are selected
    const selectedCountText = page.locator('text=/\\d+ recipes selected/');
    const countBefore = await selectedCountText.textContent();
    expect(countBefore).not.toContain('0 recipes selected');
    
    // Click Clear All
    const clearAllButton = page.getByRole('button', { name: /clear all/i });
    await clearAllButton.click();
    await page.waitForTimeout(200);
    
    // Should show 0 recipes selected
    await expect(selectedCountText).toContainText('0 recipes selected');
  });

  test('should show selected count', async ({ page }) => {
    const selectedCountText = page.locator('text=/\\d+ recipes selected/');
    
    // Initially 0
    await expect(selectedCountText).toContainText('0 recipes selected');
    
    // Select one recipe manually
    const firstRecipe = page.locator('[role="checkbox"]').first();
    await firstRecipe.click();
    await page.waitForTimeout(200);
    
    // Should show 1 selected
    await expect(selectedCountText).toContainText('1 recipes selected');
  });

  test('Export button should be disabled when no recipes selected', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /export pdf/i });
    
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeDisabled();
  });

  test('Export button should be enabled when recipes are selected', async ({ page }) => {
    // Select all recipes
    const selectAllButton = page.getByRole('button', { name: /select all/i });
    await selectAllButton.click();
    await page.waitForTimeout(200);
    
    const exportButton = page.getByRole('button', { name: /export pdf/i });
    await expect(exportButton).toBeEnabled();
  });

  test('should show helper text when no recipes selected', async ({ page }) => {
    const helperText = page.locator('text=/select at least 1 recipe/i');
    await expect(helperText).toBeVisible();
  });

  test('helper text should be hidden when recipes are selected', async ({ page }) => {
    // Select all recipes
    const selectAllButton = page.getByRole('button', { name: /select all/i });
    await selectAllButton.click();
    await page.waitForTimeout(200);
    
    const helperText = page.locator('text=/select at least 1 recipe/i');
    await expect(helperText).not.toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that key elements are still visible
    const title = page.getByRole('heading', { level: 1 });
    await expect(title).toBeVisible();
    
    const selectAllButton = page.getByRole('button', { name: /select all/i });
    await expect(selectAllButton).toBeVisible();
    
    const exportButton = page.getByRole('button', { name: /export pdf/i });
    await expect(exportButton).toBeVisible();
  });

  test('individual recipe checkboxes should be clickable', async ({ page }) => {
    // Get first recipe checkbox
    const firstRecipe = page.locator('[role="checkbox"]').first();
    await expect(firstRecipe).toBeVisible();
    
    // Check initial state
    const ariaChecked = await firstRecipe.getAttribute('aria-checked');
    expect(ariaChecked).toBe('false');
    
    // Click to select
    await firstRecipe.click();
    await page.waitForTimeout(200);
    
    // Should be checked
    const ariaCheckedAfter = await firstRecipe.getAttribute('aria-checked');
    expect(ariaCheckedAfter).toBe('true');
  });

  test('search filter should filter recipes', async ({ page }) => {
    // Get initial count of visible recipes
    const recipesBefore = await page.locator('[role="checkbox"]').count();
    
    // Type in search box
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Test Recipe 1');
    await page.waitForTimeout(300);
    
    // Should show fewer recipes
    const recipesAfter = await page.locator('[role="checkbox"]').count();
    expect(recipesAfter).toBeLessThan(recipesBefore);
  });
});
