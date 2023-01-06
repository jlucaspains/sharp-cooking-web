import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test('add new recipe', async ({ page }) => {
  await createRecipe(page, 2, "Bread 1", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 1').textContent()).toEqual('Bread 1');
});

test('create many recipes', async ({ page }) => {
  test.setTimeout(60000);
  await createRecipe(page, 2, "Bread 2", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 2').textContent()).toEqual('Bread 2');

  await createRecipe(page, 3, "Bread 3", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 3').textContent()).toEqual('Bread 3');

  await createRecipe(page, 4, "Bread 4", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 4').textContent()).toEqual('Bread 4');
});