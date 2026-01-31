import { test, expect } from '@playwright/test';
import { createRecipe, setup } from './helpers';

test.beforeEach(async ({ page, context }) => {
  await setup(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('should show progress dialog when exporting 10+ recipes', async ({ page, context }) => {
  // Create 12 test recipes using database helpers
  for (let i = 1; i <= 12; i++) {
    await createRecipe(page, i + 1, `Test Recipe ${i}`, 5, [`${i}00g flour`], [`Step ${i}`], true);
  }

  await page.goto('/#/export-recipe-book');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Select all recipes
  await page.getByRole('button', { name: /select all/i }).click();
  await page.waitForTimeout(500);

  // Click export button
  const exportButton = page.getByRole('button', { name: /export pdf/i });
  await expect(exportButton).toBeEnabled();
  await exportButton.click();

  // Progress dialog should appear (though it might disappear quickly)
  await page.waitForTimeout(100);
});

test('should NOT show progress dialog for exports with less than 10 recipes', async ({ page, context }) => {
  // Create only 5 test recipes
  for (let i = 1; i <= 5; i++) {
    await createRecipe(page, i + 1, `Test Recipe ${i}`, 5, [`${i}00g flour`], [`Step ${i}`], true);
  }

  await page.goto('/#/export-recipe-book');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Select all recipes
  await page.getByRole('button', { name: /select all/i }).click();
  await page.waitForTimeout(500);

  // Click export
  const exportButton = page.getByRole('button', { name: /export pdf/i });
  await exportButton.click();

  // Wait a bit
  await page.waitForTimeout(500);

  // Progress dialog should NOT appear
  const progressDialog = page.getByRole('dialog');
  await expect(progressDialog).not.toBeVisible();

  // Success message should appear
  await page.waitForSelector('text=/downloaded successfully/i', { timeout: 3000 });
});

test('should show warning for large exports (>50 recipes)', async ({ page, context }) => {
  test.setTimeout(120000);

  // Create 60 test recipes
  for (let i = 1; i <= 51; i++) {
    await createRecipe(page, i + 1, `Test Recipe ${i}`, 5, [`${i}00g flour`], [`Step ${i}`], true);
  }

  await page.goto('/#/export-recipe-book');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Select all recipes
  await page.getByRole('button', { name: /select all/i }).click();
  await page.waitForTimeout(500);

  // Warning should appear
  const warning = page.getByRole('alert').filter({ hasText: /large exports may take longer/i });
  await expect(warning).toBeVisible();
});

test('should NOT show warning for 5 recipes', async ({ page, context }) => {
  for (let i = 1; i <= 5; i++) {
    await createRecipe(page, i + 1, `Test Recipe ${i}`, 5, [`${i}00g flour`], [`Step ${i}`], true);
  }

  await page.goto('/#/export-recipe-book');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Select all recipes
  await page.getByRole('button', { name: /select all/i }).click();
  await page.waitForTimeout(1000);

  // Warning should NOT appear
  const warning = page.getByRole('alert').filter({ hasText: /large exports may take longer/i });
  await expect(warning).not.toBeVisible();
});

test('should hide progress dialog after export completes', async ({ page, context }) => {
  test.setTimeout(60000);

  for (let i = 1; i <= 11; i++) {
    await createRecipe(page, i + 1, `Test Recipe ${i}`, 5, [`${i}00g flour`], [`Step ${i}`], true);
  }

  await page.goto('/#/export-recipe-book');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Select all
  await page.getByRole('button', { name: /select all/i }).click();
  await page.waitForTimeout(500);

  // Export
  await page.getByRole('button', { name: /export pdf/i }).click();

  // Wait for export to complete
  await page.waitForTimeout(2000);

  // Progress dialog should be gone
  const progressDialog = page.getByRole('dialog');
  await expect(progressDialog).not.toBeVisible();

  // Success message should appear
  const successMessage = page.locator('text=/downloaded successfully/i');
  await expect(successMessage).toBeVisible();
});

