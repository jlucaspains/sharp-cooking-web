import { test, expect } from '@playwright/test';

async function createRecipe(page, id) {
  await page.goto('/');
  await page.locator('#headlessui-menu-button-1').click();
  await page.getByRole('menuitem', { name: 'Add manually' }).click();
  await expect(page).toHaveURL('/#/recipe/0/edit');
  await page.getByLabel('Title').click();
  await page.getByLabel('Title').fill(`Bread ${id}`);
  await page.getByRole('button', { name: '⭐' }).nth(3).click();
  await page.getByPlaceholder('1 cup flour').click();
  await page.getByPlaceholder('1 cup flour').fill('1000g flour');
  await page.getByPlaceholder('1 cup flour').press('Enter');
  await page.getByPlaceholder('1 cup flour').nth(1).fill('700g water');
  await page.getByPlaceholder('1 cup flour').nth(1).press('Enter');
  await page.getByPlaceholder('1 cup flour').nth(2).fill('15g salt');
  await page.getByPlaceholder('1 cup flour').nth(2).press('Tab');
  await page.getByRole('button', { name: 'Delete Ingredient' }).nth(2).press('Tab');
  await page.getByRole('button', { name: 'Add Step' }).press('Tab');
  await page.getByPlaceholder('Preheat oven to 350 F').fill('mix all ingredients');
  await page.getByPlaceholder('Preheat oven to 350 F').press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(1).fill('perform first set of folds and wait 15 minutes');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(1).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(2).fill('Perform second set of folds and wait 15 minutes');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(2).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(3).fill('Perform third set of folds');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(3).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(4).fill('Ferment for 12 hours');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(4).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(5).fill('Prepare boule and set in basket');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(5).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(6).fill('Ferment for 2 hours');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(6).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(7).fill('Preheat oven at 420F');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(7).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(8).fill('Bake for 30 minutes with lid on');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(8).press('Enter');
  await page.getByPlaceholder('Preheat oven to 350 F').nth(9).fill('Bake for 15 minutes without the lid');
  await page.locator('nav:has-text("New Recipe")').getByRole('button').nth(1).click();
  await expect(page).toHaveURL(new RegExp(`.*/recipe/${id}/edit`));
}

test('add new recipe', async ({ page }) => {
  await createRecipe(page, 2);
  await page.goto('/');
  await page.getByText('Bread 2').first().click();
});

test('create many recipes', async ({ page }) => {
  await createRecipe(page, 2);
  await page.goto('/');
  expect(await page.getByText('Bread 1').first()).toBeDefined();
  await page.getByText('Bread 2').first();
  await createRecipe(page, 3);
  await page.goto('/');
  await page.getByText('Bread 3').first();
  await createRecipe(page, 4);
  await page.goto('/');
  await page.getByText('Bread 4').first();
});