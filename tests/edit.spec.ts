import { test, expect } from '@playwright/test';

test.describe('Edit recipe', () => {
  test('title', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sourdough Bread').first().click();
    await page.getByTestId('edit-button').click();
    await page.getByLabel('Title').clear();
    await page.getByLabel('Title').fill('Changed Recipe');
    await page.getByTestId("topbar-single-button").click();
    await page.goto('/');
    expect(await page.getByText('Changed Recipe').textContent()).toEqual("Changed Recipe");
  });

  test('add ingredient', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sourdough Bread').first().click();
    await page.getByTestId('edit-button').click();
    await page.getByPlaceholder('1 cup flour').last().press("Enter");
    await page.getByPlaceholder('1 cup flour').last().fill("New Ingredient");
    await page.getByTestId("topbar-single-button").click();
    await page.goto('#/recipe/1');
    expect(await page.getByText('New Ingredient').textContent()).toEqual("New Ingredient");
  });

  test('add step', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Sourdough Bread').first().click();
    await page.getByTestId('edit-button').click();
    await page.getByPlaceholder('Preheat oven to 350 F').last().press("Enter");
    await page.getByPlaceholder('Preheat oven to 350 F').last().fill("New Step");
    await page.getByTestId("topbar-single-button").click();
    await page.goto('#/recipe/1');
    expect(await page.getByText('New Step').textContent()).toEqual("New Step");
  });
});