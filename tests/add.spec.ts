import { test, expect } from '@playwright/test';

async function createRecipe(page) {
  await page.goto('https://app.sharpcooking.net/#/');
  await page.locator('#headlessui-menu-button-1').click();
  await page.getByRole('menuitem', { name: 'Add manually' }).click();
  await expect(page).toHaveURL('https://app.sharpcooking.net/#/recipe/0/edit');
  await page.getByLabel('Title').click();
  await page.getByLabel('Title').fill('Bread');
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
  await page.locator('div:nth-child(18) > .block').fill('Prepare boule and set in basket');
  await page.locator('div:nth-child(18) > .block').press('Enter');
  await page.locator('div:nth-child(19) > .block').fill('Ferment for 2 hours');
  await page.locator('div:nth-child(19) > .block').press('Enter');
  await page.locator('div:nth-child(20) > .block').fill('Preheat oven at 420F');
  await page.locator('div:nth-child(20) > .block').press('Enter');
  await page.locator('div:nth-child(21) > .block').fill('Bake for 30 minutes with lid on');
  await page.locator('div:nth-child(21) > .block').press('Enter');
  await page.locator('div:nth-child(22) > .block').fill('Bake for 15 minutes without the lid');
  await page.locator('nav:has-text("New Recipe")').getByRole('button').nth(1).click();
  await expect(page).toHaveURL('https://app.sharpcooking.net/#/recipe/1/edit');
}

test('add new recipe', async ({ page }) => {
  await createRecipe(page);
});

test('edit 2', async ({ page }) => {
  await createRecipe(page);
  await page.goto('https://app.sharpcooking.net/#/');
  
});