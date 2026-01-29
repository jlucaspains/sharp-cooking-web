import { test, expect } from '@playwright/test';
import { clearDatabase, createRecipeData, saveRecipe } from './helpers';

test.describe('Export Recipe Book - Edge Cases', () => {
  test.beforeEach(async ({ page, context }) => {
    await clearDatabase(context);
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
  });

  test('should handle recipes without images gracefully', async ({ page, context }) => {
    // Create recipes without adding images
    for (let i = 1; i <= 3; i++) {
      const recipe = createRecipeData(`Recipe ${i}`, 5, [`Ingredient ${i}`], [`Step ${i}`], 1);
      await saveRecipe(context, recipe);
    }
    
    await page.goto('/#/export-recipe-book');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Recipes should be visible in the list
    await expect(page.getByText('Recipe 1')).toBeVisible();
    await expect(page.getByText('Recipe 2')).toBeVisible();
    await expect(page.getByText('Recipe 3')).toBeVisible();
    
    // No broken image icons should appear (they should just not show images)
    // Select and export
    await page.getByRole('button', { name: /select all/i }).click();
    await page.waitForTimeout(500);
    
    await page.getByRole('button', { name: /export pdf/i }).click();
    
    // Success message should appear
    await expect(page.getByText(/downloaded successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should keep export button disabled until at least 1 recipe selected', async ({ page, context }) => {
    // Create recipes
    for (let i = 1; i <= 3; i++) {
      const recipe = createRecipeData(`Test Recipe ${i}`, 5, [`${i}00g flour`], [`Step ${i}`], 1);
      await saveRecipe(context, recipe);
    }
    
    await page.goto('/#/export-recipe-book');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Export button should be disabled initially
    const exportButton = page.getByRole('button', { name: /export pdf/i });
    await expect(exportButton).toBeDisabled();
    
    // Helper text should be visible
    await expect(page.getByText(/select at least 1 recipe to export/i)).toBeVisible();
    
    // Select one recipe
    await page.getByRole('button', { name: /select all/i }).click();
    await page.waitForTimeout(500);
    
    // Export button should now be enabled
    await expect(exportButton).toBeEnabled();
    
    // Helper text should be hidden
    await expect(page.getByText(/select at least 1 recipe to export/i)).not.toBeVisible();
    
    // Clear all
    await page.getByRole('button', { name: /clear all/i }).click();
    await page.waitForTimeout(500);
    
    // Export button should be disabled again
    await expect(exportButton).toBeDisabled();
  });
});

