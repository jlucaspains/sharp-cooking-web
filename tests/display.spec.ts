import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.describe('Display', () => {
  test('edit', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Bread').first().click();
    await page.getByTestId('edit-button').click();
    await expect(page).toHaveURL(new RegExp(".*recipe/1/edit"));
  });

  test('change size', async ({ page }) => {
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('/');
    await page.getByText('New Bread').first().click();
    await page.getByTestId('multiplier-button').click();
    await page.getByTestId('multiplier-value').fill("2");
    await page.getByRole('button').getByText("OK").click();
    expect(await page.getByText('200g flour').textContent()).toBe('200g flour');
  });

  test('change time', async ({ page }) => {
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('/');
    await page.getByText('New Bread').first().click();
    await page.getByTestId('time-button').click();
    await page.getByTestId('time-value').type("1000AM");
    await page.getByRole('button').getByText("OK").click();
    expect(await page.getByText('10:35 AM').textContent()).toBe('10:35 AM');
  });

  test('delete', async ({ page }) => {
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('/');
    await page.getByText('New Bread').first().click();
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Yes, delete' }).click();
    await page.waitForNavigation();
    await page.waitForTimeout(1000);
    expect(await page.isVisible("text='New Bread'")).toBe(false);
  });
});