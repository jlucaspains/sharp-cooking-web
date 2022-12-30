import { test, expect } from '@playwright/test';


async function createRecipe(page, id, title, rating) {
  await page.goto('/');
  await page.locator('#headlessui-menu-button-1').click();
  await page.getByRole('menuitem', { name: 'Add manually' }).click();
  await expect(page).toHaveURL('/#/recipe/0/edit');
  await page.getByLabel('Title').click();
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: '⭐' }).nth(rating - 1).click();
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

test.describe('List of recipes', () => {
  test('title is All recipes', async ({ page }) => {
    await page.goto('/');
    const mainPage = await page.getByRole('link', { name: 'All Recipes' });
    await expect(mainPage).toHaveText('All Recipes');
  });

  test('a default recipe is created on first use', async ({ page }) => {
    await page.goto('/');
    const firstItem = await page.getByTestId('recipe-title');
    await expect(firstItem).toHaveText('Sourdough Bread');
  });

  test('sort by title', async ({ page }) => {
    await page.goto('/');
    await createRecipe(page, 2, "ZZ last recipe", 1);
    await createRecipe(page, 3, "00 first recipe", 2);
    page.goBack(); // back to main page

    await page.locator('#headlessui-menu-button-10').click();
    await page.getByRole('menuitem', { name: 'Sort by Title' }).click();

    const names = page.getByTestId('recipe-title');
    expect(names.nth(0)).toHaveText('00 first recipe');
    expect(names.nth(2)).toHaveText('ZZ last recipe');
  });

  test('sort by rating', async ({ page }) => {
    await page.goto('/');
    await createRecipe(page, 2, "ZZ last recipe", 2);
    await createRecipe(page, 3, "00 first recipe", 1);
    page.goBack(); // back to main page

    await page.locator('#headlessui-menu-button-10').click();
    await page.getByRole('menuitem', { name: 'Sort by Rating' }).click();

    const names = page.getByTestId('recipe-title');
    expect(names.nth(0)).toHaveText('00 first recipe');
    expect(names.nth(1)).toHaveText('ZZ last recipe');
  });

  
  test('sort by changed date', async ({ page }) => {
    await page.goto('/');
    await createRecipe(page, 2, "00 first recipe", 2);
    await createRecipe(page, 3, "ZZ last recipe", 1);
    page.goBack(); // back to main page

    await page.locator('#headlessui-menu-button-10').click();
    await page.getByRole('menuitem', { name: 'Sort by Rating' }).click();

    const names = page.getByTestId('recipe-title');
    expect(names.nth(1)).toHaveText('00 first recipe'); // actual first is default recipe created
    expect(names.nth(2)).toHaveText('ZZ last recipe');
  });
});