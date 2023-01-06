import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

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

  test('open default recipe', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('recipe-title').click();
    await expect(page).toHaveURL(new RegExp(`.*/recipe/1`));
  });

  test('sort by title', async ({ page }) => {
    test.setTimeout(60000);

    await createRecipe(page, 2, "ZZ last recipe", 1);
    await createRecipe(page, 3, "00 first recipe", 2);
    await page.goto('/');

    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Sort by Title' }).click();

    const names = page.getByTestId('recipe-title');
    await expect(names.nth(0)).toHaveText('00 first recipe');
    await expect(names.nth(2)).toHaveText('ZZ last recipe');
  });

  test('sort by rating', async ({ page }) => {
    test.setTimeout(60000);

    await createRecipe(page, 2, "ZZ last recipe", 2);
    await createRecipe(page, 3, "00 first recipe", 1);
    await page.goto('/');

    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Sort by Rating' }).click();

    const names = page.getByTestId('recipe-title');
    await expect(names.nth(0)).toHaveText('00 first recipe');
    await expect(names.nth(1)).toHaveText('ZZ last recipe');
  });


  test('sort by changed date', async ({ page }) => {
    test.setTimeout(60000);

    await createRecipe(page, 2, "00 first recipe", 2);
    await createRecipe(page, 3, "ZZ last recipe", 1);
    await page.goto('/');

    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Sort by Changed Date' }).click();

    const names = page.getByTestId('recipe-title');
    await expect(names.nth(1)).toHaveText('00 first recipe'); // actual first is default recipe created
    await expect(names.nth(2)).toHaveText('ZZ last recipe');
  });

  test('options menu go to options', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();

    await expect(page).toHaveURL(new RegExp(".*/options"));
  });

  test('add manually', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('add-menu-button').click();
    await page.getByRole('menuitem', { name: 'Add manually' }).click();

    await expect(page).toHaveURL(new RegExp(".*/recipe/0/edit"));
  });

  test('import from website', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('add-menu-button').click();
    await page.getByRole('menuitem', { name: 'Import from website' }).click();

    await expect(page).toHaveURL(new RegExp(/.*\/recipe\/0\/edit\?import=1/));
  });

  test('import from backup', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('add-menu-button').click();
    await page.getByRole('menuitem', { name: 'Import from backup file' }).click();

    await expect(page).toHaveURL(new RegExp(".*/import-backup"));
  });
});