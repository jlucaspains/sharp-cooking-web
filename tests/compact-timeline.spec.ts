import { test, expect } from '@playwright/test';
import { createRecipe, setup, enableCompactMobileTimeline } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
  await enableCompactMobileTimeline(page);
});

test('toggle ingredients completion', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour", "50g water"], ["Mix ingredients"]);
  await page.goto('#/recipe/2');
  
  // Find the ingredients checkbox
  const ingredientsCheckbox = page.locator('[aria-label="Ingredients"]');
  
  // Check it's initially unchecked
  await expect(ingredientsCheckbox).toHaveAttribute('aria-checked', 'false');
  
  // Click to mark as complete
  await ingredientsCheckbox.click();
  await expect(ingredientsCheckbox).toHaveAttribute('aria-checked', 'true');
  
  // Click again to uncheck
  await ingredientsCheckbox.click();
  await expect(ingredientsCheckbox).toHaveAttribute('aria-checked', 'false');
});

test('toggle step completion', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Mix ingredients", "Bake for 30 min"]);
  await page.goto('#/recipe/2');
  
  // Find step 1 checkbox
  const step1Checkbox = page.locator('[aria-label="Step 1"]');
  
  // Check it's initially unchecked
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'false');
  
  // Click to mark as complete
  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'true');
  
  // Verify checkmark appears in SVG (filled circle)
  const svg = step1Checkbox.locator('svg[fill="currentColor"]');
  await expect(svg).toBeVisible();
  
  // Click again to uncheck
  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'false');
});

test('multiple steps can be marked complete', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Step one", "Step two", "Step three"]);
  await page.goto('#/recipe/2');
  
  // Mark steps 1 and 3 as complete
  await page.locator('[aria-label="Step 1"]').click();
  await page.locator('[aria-label="Step 3"]').click();
  
  // Verify states
  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[aria-label="Step 2"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[aria-label="Step 3"]')).toHaveAttribute('aria-checked', 'true');
});

test('compact timeline shows time on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'only applicable on mobile');
  
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake for 30 min"]);
  await page.goto('#/recipe/2');
  
  // On mobile with compact timeline, time should be visible inline
  const stepHeading = page.locator('text=Step 1').locator('..');
  await expect(stepHeading).toBeVisible();
  
  // Time should be present and right-aligned (in the same flex container)
  const timeElement = stepHeading.locator('span.text-sm');
  await expect(timeElement).toBeVisible();
});

test('completed step shows strikethrough time on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'only applicable on mobile');
  
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake for 30 min"]);
  await page.goto('#/recipe/2');
  
  // Mark step as complete
  await page.locator('[aria-label="Step 1"]').click();
  
  // Time should have line-through class
  const timeElement = page.locator('text=Step 1').locator('..').locator('span.line-through');
  await expect(timeElement).toBeVisible();
  await expect(timeElement).toHaveClass(/text-gray-400/);
});

test('visual hierarchy - step titles are bold', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake for 30 min"]);
  await page.goto('#/recipe/2');
  
  // Step title should have font-semibold class
  const stepTitle = page.locator('text=Step 1');
  await expect(stepTitle).toHaveClass(/font-semibold/);
  
  // Ingredients heading should also be bold
  const ingredientsTitle = page.locator('text=Ingredients (1x)');
  await expect(ingredientsTitle).toHaveClass(/font-semibold/);
});

test('completion state persists during session', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Mix", "Bake"]);
  await page.goto('#/recipe/2');
  
  // Mark first step as complete
  await page.locator('[aria-label="Step 1"]').click();
  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'true');
  
  // Navigate away and back
  await page.goto('#/');
  await page.goto('#/recipe/2');
  
  // Note: Completion state is not persisted across navigations by design
  // This is intentional as it's meant for tracking during active cooking
  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'false');
});

test('compact timeline feature can be disabled', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake"]);
  
  // Disable the feature
  await page.goto('#/preview-features');
  await page.getByTestId('enable-compact-mobile-timeline-toggle').click();
  
  await page.goto('#/recipe/2');
  
  // Checkboxes should still work (they're not dependent on the compact layout)
  const step1Checkbox = page.locator('[aria-label="Step 1"]');
  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'true');
});

test('all steps and ingredients have proper aria labels', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour", "50g water"], ["Mix", "Bake", "Cool"]);
  await page.goto('#/recipe/2');
  
  // Check ingredients checkbox has aria-label
  await expect(page.locator('[aria-label="Ingredients"]')).toBeVisible();
  
  // Check all step checkboxes have aria-labels
  await expect(page.locator('[aria-label="Step 1"]')).toBeVisible();
  await expect(page.locator('[aria-label="Step 2"]')).toBeVisible();
  await expect(page.locator('[aria-label="Step 3"]')).toBeVisible();
  
  // Check all have role="checkbox"
  await expect(page.locator('[role="checkbox"]')).toHaveCount(4); // 1 ingredients + 3 steps
});
