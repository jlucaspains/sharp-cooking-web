import { test, expect, Page } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("DoNotAskToInstall", "true");
  });
});


async function createCategory(page: Page, id: number, title: string) {
  await page.goto('/#/categories');
  await page.getByTestId('add-menu-button').click();
  await page.getByTestId('new-category-name').fill(title);
  await page.getByText('OK').click();
}

test('add new category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  expect(await page.locator('.category-item').count()).toBe(1);
  expect(await page.getByText('Category 1').first()).toBeVisible();
});

test('add multiple category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await createCategory(page, 2, "Category 2");
  await createCategory(page, 3, "Category 3");
  await createCategory(page, 4, "Category 4");
  expect(await page.locator('.category-item').count()).toBe(4);
  expect(await page.getByText('Category 1').count()).toBe(1);
  expect(await page.getByText('Category 2').count()).toBe(1);
  expect(await page.getByText('Category 3').count()).toBe(1);
  expect(await page.getByText('Category 4').count()).toBe(1);
});

test('edit category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await page.getByRole('img', { name: 'Category' }).click();
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Edit...' }).click();
  await page.getByTestId('edit-category-name').fill('Category 2');
  await page.getByRole('button', { name: 'OK' }).click();
  expect(await page.locator('.category-item').count()).toBe(1);
  expect(await page.getByText('Category 2').count()).toBe(1);
});

test('delete category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await page.locator('.category-item').first().click();
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Delete...' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(500);
  expect(await page.locator('.category-item').count()).toBe(0);
  expect(await page.getByText('Category 1').count()).toBe(0);
});
