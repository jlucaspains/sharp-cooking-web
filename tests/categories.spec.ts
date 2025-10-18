import { test, expect } from '@playwright/test';
import { createCategory, setup } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
});

test('add new category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await expect(page.locator('.category-item')).toHaveCount(1);
  await expect(page.getByText('Category 1')).toHaveCount(1);
});

test('add multiple category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await createCategory(page, 2, "Category 2");
  await createCategory(page, 3, "Category 3");
  await createCategory(page, 4, "Category 4");
  await expect(page.locator('.category-item')).toHaveCount(4);
  await expect(page.getByText('Category 1')).toHaveCount(1);
  await expect(page.getByText('Category 2')).toHaveCount(1);
  await expect(page.getByText('Category 3')).toHaveCount(1);
  await expect(page.getByText('Category 4')).toHaveCount(1);
});

test('edit category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await page.getByTestId('edit-category').click();
  await page.getByTestId('edit-category-name').fill('Category 2');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.locator('.category-item')).toHaveCount(1);
  await expect(page.getByText('Category 2')).toHaveCount(1);
});

test('delete category', async ({ page }) => {
  await createCategory(page, 1, "Category 1");
  await page.getByTestId('delete-category').click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForTimeout(500);
  await expect(page.locator('.category-item')).toHaveCount(0);
  await expect(page.getByText('Category 1')).toHaveCount(0);
});
