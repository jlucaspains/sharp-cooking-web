import { test, expect } from '@playwright/test';
import { setup } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
});

test('export recipe book menu item appears in dropdown', async ({ page }) => {
  await page.goto('/');
  
  await page.getByTestId('topbar-options').click();
  const exportMenuItem = await page.getByRole('menuitem', { name: 'Export Recipe Book' });
  await expect(exportMenuItem).toBeVisible();
});

test('clicking export recipe book navigates to /export-recipe-book', async ({ page }) => {
  await page.goto('/');
  
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Export Recipe Book' }).click();
  
  await expect(page).toHaveURL(new RegExp(".*/export-recipe-book"));
});
