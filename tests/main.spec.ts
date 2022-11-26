import { test, expect } from '@playwright/test';

// test('homepage has title and links to intro page', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);

//   // create a locator
//   const getStarted = page.getByRole('link', { name: 'Get started' });

//   // Expect an attribute "to be strictly equal" to the value.
//   await expect(getStarted).toHaveAttribute('href', '/docs/intro');

//   // Click the get started link.
//   await getStarted.click();

//   // Expects the URL to contain intro.
//   await expect(page).toHaveURL(/.*intro/);
// });

test('main page title is All recipes', async ({ page }) => {
  await page.goto('https://app.sharpcooking.net/#/');
  const mainPage = await page.getByRole('link', { name: 'All Recipes' });
  await expect(mainPage).toHaveText('All Recipes');
});