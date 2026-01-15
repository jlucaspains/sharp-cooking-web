import { test, expect } from '@playwright/test';
import { createCategory, setup } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
  await page.goto('#/options');
  await page.getByTestId('enable-category-toggle').click();
});

test('title is Home', async ({ page }) => {
  await page.goto('/');
  const mainPage = page.getByRole('link', { name: 'Home' });
  await expect(mainPage).toHaveText('Home');
});

test('open default category', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('recipe-title')).toHaveText("All");
  await page.getByTestId('recipe-title').click();
  await page.waitForTimeout(500);
  await page.getByTestId('recipe-title').click();
  await expect(page).toHaveURL(/.*\/recipe\/1/);
});

test('displays custom category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");

  await page.goto('/#/recipe/0/edit');
  await page.getByLabel('Title').fill('Recipe 1');
  await page.getByLabel('Category').selectOption('Category 1');
  await page.getByPlaceholder('1 cup flour').last().fill('1 cup flour');
  await page.getByPlaceholder('Preheat oven to 350 F').last().fill('Preheat oven to 350 F');
  await page.getByTestId("topbar-single-button").click();

  await page.waitForTimeout(500);
  await page.goto('/');
  await expect(page.getByText('Category 1')).toHaveText("Category 1");
  await expect(page.getByTestId('recipe-count').first()).toHaveText("1");
});

test('options menu go to options', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Options' }).click();

  await expect(page).toHaveURL(/.*\/options/);
});

test('all category appears last by default', async ({ page }) => {
  await createCategory(page, 1, "Category 1");

  await page.goto('/#/recipe/0/edit');
  await page.getByLabel('Title').fill('Recipe 1');
  await page.getByLabel('Category').selectOption('Category 1');
  await page.getByPlaceholder('1 cup flour').last().fill('1 cup flour');
  await page.getByPlaceholder('Preheat oven to 350 F').last().fill('Preheat oven to 350 F');
  await page.getByTestId("topbar-single-button").click();

  await page.waitForTimeout(500);
  await page.goto('/');


  // Get all category names

  const categoryItems = page.getByTestId('category-item');
  await expect(categoryItems).toHaveCount(2);

  // Check that "All" is last
  const lastCategory = categoryItems.nth(1);
  await expect(lastCategory).toContainText('All');
});

test('all category appears first when toggle enabled', async ({ page }) => {
  await createCategory(page, 1, "Category 1");

  await page.goto('/#/recipe/0/edit');
  await page.getByLabel('Title').fill('Recipe 1');
  await page.getByLabel('Category').selectOption('Category 1');
  await page.getByPlaceholder('1 cup flour').last().fill('1 cup flour');
  await page.getByPlaceholder('Preheat oven to 350 F').last().fill('Preheat oven to 350 F');
  await page.getByTestId("topbar-single-button").click();

  await page.waitForTimeout(500);
  await page.goto('/');

  await page.goto('#/options');
  await page.getByTestId('all-category-first-toggle').click();

  await page.goto('/');

  // Get all category names
  const categoryItems = page.getByTestId('category-item');
  await expect(categoryItems).toHaveCount(2);

  // Check that "All" is first
  const firstCategory = categoryItems.nth(0);
  await expect(firstCategory).toContainText('All');
});