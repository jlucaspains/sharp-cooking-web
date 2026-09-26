import { test, expect } from '@playwright/test';
import { createRecipe, setup } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
});

test('toggle step completion', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Mix ingredients", "Bake for 30 min"]);
  await page.goto('#/recipe/2/view');

  const step1Checkbox = page.locator('[aria-label="Step 1"]');

  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'false');

  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'true');

  const svg = step1Checkbox.locator('svg[fill="currentColor"]');
  await expect(svg).toBeVisible();

  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'false');
});

test('multiple steps can be marked complete', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Step one", "Step two", "Step three"]);
  await page.goto('#/recipe/2/view');

  await page.locator('[aria-label="Step 1"]').click();
  await page.locator('[aria-label="Step 3"]').click();

  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[aria-label="Step 2"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[aria-label="Step 3"]')).toHaveAttribute('aria-checked', 'true');
});

test('step time shows inline next to the step title', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake for 30 min"]);
  await page.goto('#/recipe/2/view');

  const stepHeading = page.locator('text=Step 1').locator('..');
  await expect(stepHeading).toBeVisible();

  const timeElement = stepHeading.locator('span.text-sm');
  await expect(timeElement).toBeVisible();
});

test('visual hierarchy - step and ingredients titles are bold', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake for 30 min"]);
  await page.goto('#/recipe/2/view');

  const stepTitle = page.locator('text=Step 1');
  await expect(stepTitle).toHaveClass(/font-semibold/);

  const ingredientsTitle = page.locator('text=Ingredients (1x)');
  await expect(ingredientsTitle).toHaveClass(/font-semibold/);
});

test('completion state persists during session', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Mix", "Bake"]);
  await page.goto('#/recipe/2/view');

  await page.locator('[aria-label="Step 1"]').click();
  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'true');

  // Navigate away and back
  await page.goto('#/');
  await page.goto('#/recipe/2/view');
  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'false');
});

test('all steps have proper aria labels', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour", "50g water"], ["Mix", "Bake", "Cool"]);
  await page.goto('#/recipe/2/view');

  // Unlike the regular recipe page, there is no ingredients checkbox here.
  await expect(page.locator('[aria-label="Ingredients"]')).toHaveCount(0);

  await expect(page.locator('[aria-label="Step 1"]')).toBeVisible();
  await expect(page.locator('[aria-label="Step 2"]')).toBeVisible();
  await expect(page.locator('[aria-label="Step 3"]')).toBeVisible();

  await expect(page.locator('[role="checkbox"]')).toHaveCount(3); // 3 steps, no ingredients checkbox
});
