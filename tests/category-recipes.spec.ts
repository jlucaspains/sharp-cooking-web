import { test, expect, Page } from '@playwright/test';
import { createCategory, createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("DoNotAskToInstall", "true");
  });

  await page.goto('/');
  await page.waitForTimeout(200);

  await page.goto('#/preview-features');
  await page.getByTestId('enable-category-toggle').click();

  await createCategory(page, 1, "Category 1");
});

async function goToCategory(page: Page, category: string) {
  await page.goto('/');
  await page.getByText(category).click();
  await page.waitForTimeout(200);
}

test('title is Category 1', async ({ page }) => {
  await createRecipe(page, 2, "recipe", 1, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await goToCategory(page, "Category 1");
  const mainPage = page.getByRole('link', { name: 'Category 1' });
  await expect(mainPage).toHaveText('Category 1');
});

test('open recipe', async ({ page }) => {
  await createRecipe(page, 2, "recipe", 1, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await goToCategory(page, "Category 1");
  await page.getByTestId('recipe-title').first().click();
  await expect(page).toHaveURL(/.*\/recipe\/2/);
});

test('sort by title', async ({ page }) => {
  test.setTimeout(60000);

  await createRecipe(page, 2, "ZZ last recipe", 1, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await page.goto('/');
  await createRecipe(page, 3, "00 first recipe", 2, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Sort by Title' }).click();

  const names = page.getByTestId('recipe-title');
  await expect(names.nth(0)).toHaveText('00 first recipe');
  await expect(names.nth(1)).toHaveText('ZZ last recipe');
});

test('sort by rating', async ({ page }) => {
  test.setTimeout(60000);

  await createRecipe(page, 2, "ZZ last recipe", 2, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await page.goto('/');
  await createRecipe(page, 3, "00 first recipe", 1, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Sort by Rating' }).click();

  const names = page.getByTestId('recipe-title');
  await expect(names.nth(0)).toHaveText('00 first recipe');
  await expect(names.nth(1)).toHaveText('ZZ last recipe');
});


test('sort by changed date', async ({ page }) => {
  test.setTimeout(60000);

  await createRecipe(page, 2, "00 first recipe", 2, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await page.goto('/');
  await createRecipe(page, 3, "ZZ last recipe", 1, ["1 cup flour"], ["Preheat oven to 350 F"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Sort by Changed Date' }).click();

  const names = page.getByTestId('recipe-title');
  await expect(names.nth(0)).toHaveText('00 first recipe'); // actual first is default recipe created
  await expect(names.nth(1)).toHaveText('ZZ last recipe');
});

test('options menu go to options', async ({ page }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Options' }).click();

  await expect(page).toHaveURL(/.*\/options/);
});

test('add manually', async ({ page }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('add-menu-button').click();
  await page.getByRole('menuitem', { name: 'Add manually' }).click();

  await expect(page).toHaveURL(/.*\/recipe\/0\/edit/);
  await expect(page.getByLabel('Category')).toHaveValue("1");
});

test('import from website', async ({ page }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('add-menu-button').click();
  await page.getByRole('menuitem', { name: 'Import from website' }).click();

  await expect(page).toHaveURL(/.*\/recipe\/0\/edit\?importFromUrl=1/);
});

test('import from backup', async ({ page }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('add-menu-button').click();
  await page.getByRole('menuitem', { name: 'Import from backup file' }).click();

  await expect(page).toHaveURL(/.*\/import-backup/);
});


test('search simple', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.waitForTimeout(500);
  await page.getByTestId('search-input').fill("Cookie");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});

test('search advanced by typing title', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.getByTestId('search-input').fill("title: Cookie");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});

test('search advanced by typing ingredient', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.getByTestId('search-input').fill("ingredients: dough");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});

test('search advanced by typing step', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake at 354F it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.getByTestId('search-input').fill("steps: 354F");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});


test('search advanced by selecting title', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.getByTestId('search-by-title').click();
  await page.getByTestId('search-input').pressSequentially("cookie");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});

test('search advanced by selecting ingredient', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.getByTestId('search-by-ingredients').click();
  await page.getByTestId('search-input').pressSequentially("dough");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});

test('search advanced by selecting step', async ({ page, isMobile }) => {
  await createRecipe(page, 2, "Favorite cookie", 5, ["1 cookie dough"], ["Bake at 354F it!"], false, "Category 1");
  await goToCategory(page, "Category 1");

  await page.getByTestId('topbar-single-button').click();
  await page.getByTestId('search-by-steps').click();
  await page.getByTestId('search-input').pressSequentially("354F");
  await page.waitForTimeout(500);
  const names = page.getByTestId('recipe-title');
  await expect(names).toHaveCount(1);
  await expect(names.first()).toHaveText('Favorite cookie');
});