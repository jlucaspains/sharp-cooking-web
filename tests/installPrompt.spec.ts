import { test, expect } from '@playwright/test';

test('will show install prompt on webkit', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'not applicable');

  await page.goto('/');
  await expect(page.getByText("Install Sharp Cooking")).toHaveText("Install Sharp Cooking");
});

test('will show install prompt on chromium', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');

  await page.addInitScript(() => {

    setTimeout(() => {
      const event = new Event('beforeinstallprompt');

      (window as any).dispatchEvent(event);
    }, 1000);
  });

  await page.goto('/');
  await page.waitForTimeout(2000);

  await expect(page.getByText("Install Sharp Cooking")).toHaveText("Install Sharp Cooking");
});

test('will hide install prompt after installed on chromium', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');

  await page.addInitScript(() => {

    setTimeout(() => {
      const event = new Event('beforeinstallprompt');

      (window as any).dispatchEvent(event);
    }, 1000);

    setTimeout(() => {
      const event = new Event('appinstalled');

      (window as any).dispatchEvent(event);
    }, 2000);
  });

  await page.goto('/');
  await page.waitForTimeout(3000);
  await expect(page.getByText("Install Sharp Cooking")).toHaveCount(0);
});