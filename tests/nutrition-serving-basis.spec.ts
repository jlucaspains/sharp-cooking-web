import { test, expect } from '@playwright/test';
import { setup, createRecipeWithoutSaving } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
});

test('Serving basis label displays correctly for per-serving nutrition', async ({ page }) => {
  await createRecipeWithoutSaving(page, 'Sourdough Bread 2', 3,  [
    "1000g flour",
    "700g water",
    "15g salt",
], [
    "Perform first set of folds and wait 15 minutes",
    "Perform second set of folds and wait 15 minutes",
    "Perform third set of folds",
    "Ferment for 12 hours",
    "Prepare boule and set in basket",
    "Ferment for 2 hours",
    "Preheat oven at 420F",
    "Bake for 30 minutes with lid on"
]);

  await page.locator('input#servingSize').fill('5');
  await page.locator('input#calories').fill('100');
  await page.locator('input#protein').fill('6');

  await page.getByTestId("topbar-single-button").click();

  // Navigate to view page to see the nutrition label
  await page.goto('/');
  await page.getByText('Sourdough Bread 2').first().click();
  await page.waitForLoadState('networkidle');

  // Open nutrition facts modal
  await page.getByTestId('nutrition-button').click();
  await page.waitForLoadState('networkidle');

  // Check that the serving basis label is displayed correctly
  const servingBasisLabel = page.getByTestId('servingsPerRecipe');
  await expect(servingBasisLabel).toBeVisible();
  await expect(servingBasisLabel).toContainText('5 Servings per recipe');
});

test('Serving basis label displays correctly for per-100g nutrition', async ({ page }) => {
  await createRecipeWithoutSaving(page, 'Sourdough Bread 2', 3,  [
    "1000g flour",
    "700g water",
    "15g salt",
], [
    "Perform first set of folds and wait 15 minutes",
    "Perform second set of folds and wait 15 minutes",
    "Perform third set of folds",
    "Ferment for 12 hours",
    "Prepare boule and set in basket",
    "Ferment for 2 hours",
    "Preheat oven at 420F",
    "Bake for 30 minutes with lid on"
]);

  await page.locator('input#calories').fill('100');
  await page.locator('input#protein').fill('6');

  await page.getByTestId("topbar-single-button").click();

  // Navigate to view page to see the nutrition label
  await page.goto('/');
  await page.getByText('Sourdough Bread 2').first().click();
  await page.waitForLoadState('networkidle');

  // Open nutrition facts modal
  await page.getByTestId('nutrition-button').click();
  await page.waitForLoadState('networkidle');

  // Check that the serving basis label displays "Per 100g"
  await expect(page.getByText('100g')).toBeVisible();
});