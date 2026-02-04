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
