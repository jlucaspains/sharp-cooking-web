import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase('RecipeDatabase');
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => {
        setTimeout(() => resolve(), 1000);
      };
    });
  });
  await page.waitForTimeout(500);
});

test('should trigger PDF download when export button clicked', async ({ page }) => {
  // Setup test data with 3 recipes
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true);
  await createRecipe(page, 3, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true);
  await createRecipe(page, 4, 'Strawberry Pie', 5, ['200g flour'], ['Mix and bake'], true);

  // Navigate to export page
  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  // Select all recipes
  await page.click('button:has-text("Select All")');
  await page.waitForTimeout(500);

  // Click export button - this should trigger the export without errors
  await page.click('button:has-text("Export PDF")');
  await page.waitForTimeout(2000);

  // Verify success message appears
  const successMessage = page.locator('text=Recipe book downloaded successfully!');
  await expect(successMessage).toBeVisible();
});

test('should show success message after export', async ({ page }) => {
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true);
  await createRecipe(page, 3, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true);
  await createRecipe(page, 4, 'Strawberry Pie', 5, ['200g flour'], ['Mix and bake'], true);

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Select All")');
  await page.waitForTimeout(500);

  // Mock PDF save
  await page.evaluate(() => {
    (window as any).jspdf = (window as any).jspdf || {};
    (window as any).jspdf.jsPDF = (window as any).jspdf.jsPDF || class {
      constructor() { }
      addPage() { return this; }
      setFontSize() { return this; }
      setFont() { return this; }
      text() { return this; }
      addImage() { return this; }
      save() { return this; }
      internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    };
  });

  await page.click('button:has-text("Export PDF")');
  await page.waitForTimeout(1000);

  // Check for success message
  const successMessage = page.locator('text=Recipe book downloaded successfully!');
  await expect(successMessage).toBeVisible();
});

test('should export only selected recipes', async ({ page }) => {
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true);
  await createRecipe(page, 3, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true);
  await createRecipe(page, 4, 'Strawberry Pie', 5, ['200g flour'], ['Mix and bake'], true);

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  // Select only first and third recipes
  const recipeItems = page.locator('[role="checkbox"]');
  await recipeItems.nth(0).click();
  await recipeItems.nth(2).click();
  await page.waitForTimeout(500);

  // Verify selection count shows 2
  const selectedCount = page.locator('text=/2 recipes? selected/');
  await expect(selectedCount).toBeVisible();

  // Export and verify success
  await page.click('button:has-text("Export PDF")');
  await page.waitForTimeout(2000);

  const successMessage = page.locator('text=Recipe book downloaded successfully!');
  await expect(successMessage).toBeVisible();
});

test('should handle recipes without images', async ({ page }) => {
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true);
  await createRecipe(page, 3, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true);
  await createRecipe(page, 4, 'Strawberry Pie', 5, ['200g flour'], ['Mix and bake'], true);

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  await page.click('button:has-text("Select All")');
  await page.waitForTimeout(500);

  // Mock PDF with image tracking
  let addImageCalled = false;
  await page.evaluate(() => {
    (window as any).jspdf = (window as any).jspdf || {};
    (window as any).jspdf.jsPDF = (window as any).jspdf.jsPDF || class {
      constructor() { }
      addPage() { return this; }
      setFontSize() { return this; }
      setFont() { return this; }
      text() { return this; }
      addImage() {
        (window as any).imageAdded = true;
        return this;
      }
      save() { return this; }
      internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    };
  });

  await page.click('button:has-text("Export PDF")');
  await page.waitForTimeout(1000);

  // PDF should be generated without errors (no image added)
  const imageAdded = await page.evaluate(() => (window as any).imageAdded);
  expect(imageAdded).toBeFalsy();
});
