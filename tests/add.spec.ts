import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test('add new recipe', async ({ page }) => {
  await createRecipe(page, 2, "Bread", 5);
  await page.goto('/');
  expect(await page.getByText('Bread').first()).toBeDefined();
});

test('create many recipes', async ({ page }) => {
  await createRecipe(page, 2, "Bread 2", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 2').first()).toBeDefined();

  await createRecipe(page, 3, "Bread 3", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 3').first()).toBeDefined();

  await createRecipe(page, 4, "Bread 4", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 4').first()).toBeDefined();
});