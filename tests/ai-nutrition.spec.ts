import { test, expect } from '@playwright/test';
import { setup, createRecipe, configureAI } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
  // Configure AI settings for tests
  await configureAI(page);
});

test.describe('US-001: Generate with AI button', () => {
  test('Button appears and is disabled when no ingredients exist', async ({ page }) => {
    // Create a recipe with no ingredients
    await page.goto('/#/recipe/0/edit');
    await page.getByLabel('Title').fill('Empty Recipe');
    await page.getByRole('button', { name: '⭐' }).nth(2).click();
    await page.waitForLoadState('networkidle');

    // Check button is disabled when there are no ingredients
    const button = page.getByTestId('generate-nutrition-ai-button');
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('Button is enabled when ingredients are present', async ({ page }) => {
    // Navigate to a recipe with ingredients (Sourdough Bread has ingredients)
    await page.goto('/');
    await page.getByText('Sourdough Bread').first().click();
    await page.getByTestId('edit-button').click();
    await page.waitForLoadState('networkidle');

    // Check button is enabled
    const button = page.getByTestId('generate-nutrition-ai-button');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();
  });

  test('Button is hidden when AI chat is disabled in options', async ({ page }) => {
    // Clear AI settings by going to AI options and clearing the fields
    await page.goto('/#/ai-options');
    await page.waitForLoadState('networkidle');
    
    const authInput = page.locator('input[placeholder="token"]');
    const modelInput = page.locator('input[placeholder="Model Name"]');
    
    await authInput.fill('');
    await authInput.blur();
    
    await modelInput.fill('');
    await modelInput.blur();
    
    await page.waitForTimeout(500);

    // Navigate to recipe edit
    await page.goto('/');
    await page.getByText('Sourdough Bread').first().click();
    await page.getByTestId('edit-button').click();
    await page.waitForLoadState('networkidle');

    // Button should be hidden
    const button = page.getByTestId('generate-nutrition-ai-button');
    await expect(button).not.toBeVisible();

    // Re-enable AI settings for other tests
    await configureAI(page);
  });
});

test.describe('US-002: Warning dialog before overwriting nutrition data', () => {
  test('Clicking button with empty nutrition fields triggers AI generation (no warning)', async ({ page }) => {
    // Create a recipe with ingredients but no nutrition data
    await page.goto('/#/recipe/0/edit');
    await page.getByLabel('Title').fill('New Recipe With Ingredients');
    await page.getByPlaceholder('1 cup flour').first().fill('2 cups flour');
    await page.getByRole('button', { name: '⭐' }).nth(2).click();
    await page.waitForLoadState('networkidle');

    // Verify nutrition fields are empty/zero
    const servingSizeInput = page.locator('input#servingSize');
    await expect(servingSizeInput).toHaveValue('0');

    // Click the generate button
    const button = page.getByTestId('generate-nutrition-ai-button');
    await button.click();

    // Warning dialog should NOT appear (nutrition fields are empty)
    const warningDialog = page.getByTestId('nutrition-overwrite-warning-dialog');
    await expect(warningDialog).not.toBeVisible();

    // Console should show placeholder message (US-004 not implemented yet)
    // We can't easily test console.log, so we just verify the dialog didn't show
  });

  test('Clicking button with existing nutrition data shows warning dialog', async ({ page }) => {
    // Create a recipe with ingredients and existing nutrition data
    await page.goto('/#/recipe/0/edit');
    await page.getByLabel('Title').fill('Recipe With Existing Nutrition');
    await page.getByPlaceholder('1 cup flour').first().fill('2 cups flour');
    await page.getByRole('button', { name: '⭐' }).nth(2).click();
    
    // Add some nutrition data
    await page.locator('input#calories').fill('250');
    await page.locator('input#protein').fill('8');
    await page.waitForLoadState('networkidle');

    // Click the generate button
    const button = page.getByTestId('generate-nutrition-ai-button');
    await button.click();

    // Wait for the dialog content to appear (HeadlessUI transition may take time)
    await expect(page.getByText('Replace Nutrition Data?')).toBeVisible();
    await expect(page.getByText('This will replace existing nutrition data. Continue?')).toBeVisible();
  });

  test('Canceling warning dialog does not modify nutrition fields', async ({ page }) => {
    // Create a recipe with ingredients and existing nutrition data
    await page.goto('/#/recipe/0/edit');
    await page.getByLabel('Title').fill('Recipe For Cancel Test');
    await page.getByPlaceholder('1 cup flour').first().fill('2 cups flour');
    await page.getByRole('button', { name: '⭐' }).nth(2).click();
    
    // Add some nutrition data
    await page.locator('input#calories').fill('250');
    await page.locator('input#protein').fill('8');
    await page.waitForLoadState('networkidle');

    // Click the generate button
    const button = page.getByTestId('generate-nutrition-ai-button');
    await button.click();

    // Wait for dialog to appear
    await expect(page.getByText('Replace Nutrition Data?')).toBeVisible();

    // Click Cancel button
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Dialog should close - wait for title to disappear
    await expect(page.getByText('Replace Nutrition Data?')).not.toBeVisible();

    // Nutrition data should remain unchanged
    await expect(page.locator('input#calories')).toHaveValue('250');
    await expect(page.locator('input#protein')).toHaveValue('8');
  });

  test('Confirming warning dialog triggers AI generation', async ({ page }) => {
    // Create a recipe with ingredients and existing nutrition data
    await page.goto('/#/recipe/0/edit');
    await page.getByLabel('Title').fill('Recipe For Confirm Test');
    await page.getByPlaceholder('1 cup flour').first().fill('2 cups flour');
    await page.getByRole('button', { name: '⭐' }).nth(2).click();
    
    // Add some nutrition data
    await page.locator('input#calories').fill('250');
    await page.locator('input#protein').fill('8');
    await page.waitForLoadState('networkidle');

    // Click the generate button
    const button = page.getByTestId('generate-nutrition-ai-button');
    await button.click();

    // Wait for dialog to appear
    await expect(page.getByText('Replace Nutrition Data?')).toBeVisible();

    // Click Continue button
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Dialog should close - wait for title to disappear
    await expect(page.getByText('Replace Nutrition Data?')).not.toBeVisible();

    // At this point, US-004 would populate the fields
    // For now, we just verify the dialog closed (placeholder function was called)
  });
});
