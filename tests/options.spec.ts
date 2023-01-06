import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.describe('Options', () => {
  test('create backup', async ({ page }) => {
    await page.addInitScript(() => {
      // const file = new File([""], "test.json");
      const stream = new WritableStream();
      (window as any).showSaveFilePicker = async (param: any) => {
        console.log("showSaveFilePicker");
        return { createWritable: async () => { return stream } };
      };
    });

    await page.goto('/');
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByText('Take a backup').click();
  });

  test('restore backup', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByText('Restore a backup').click();
    await expect(page).toHaveURL(new RegExp(".*/recipe/import-backup"));
  });
  
  test('change language', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByText('Language').click();
    await page.getByText('Portuguese').click();
    await page.getByRole('button').getByText("OK").click();
    await page.waitForTimeout(1000);
    expect(await page.isVisible("text='Cozinha Afiada'")).toBe(true);
  });
  
  test('multiplier to use fractions', async ({ page }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1g salt"], ["Bake it for 30 min"]);
    await page.goto('/');
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByTestId('use-fractions-toggle').click();
    await page.goto('#/recipe/2');
    await page.getByTestId('multiplier-button').click();
    await page.getByTestId('multiplier-value').fill("0.5");
    await page.getByRole('button').getByText("OK").click();
    expect(await page.getByText('1/2g salt').textContent()).toBe('1/2g salt');
  });

  
  test('steps interval', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await createRecipe(page, 2, "New Bread", 5, ["1g salt"], ["Bake it for 30 min"]);
    await page.goto('/');
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByText('Steps Interval').click();
    await page.getByTestId('steps-interval-input').clear();
    await page.getByTestId('steps-interval-input').fill("10");
    await page.getByRole('button').getByText("OK").click();
    await page.goto('#/recipe/2');
    await page.getByTestId('time-button').click();
    await page.getByTestId('time-value').type("1000AM");
    await page.getByRole('button').getByText("OK").click();
    expect(await page.getByText('10:40 AM').textContent()).toBe('10:40 AM');
  });

  test('steps interval webkit', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'not applicable');

    await createRecipe(page, 2, "New Bread", 5, ["1g salt"], ["Bake it for 30 min"]);
    await page.goto('/');
    await page.getByTestId('topbar-options').click();
    await page.getByRole('menuitem', { name: 'Options' }).click();
    await page.getByText('Steps Interval').click();
    await page.getByTestId('steps-interval-input').clear();
    await page.getByTestId('steps-interval-input').fill("10");
    await page.getByRole('button').getByText("OK").click();
    await page.goto('#/recipe/2');
    await page.getByTestId('time-button').click();
    await page.screenshot({ path: 'test-results/steps-webkit.png'});
    await page.getByTestId('time-value-input').clear();
    await page.getByTestId('time-value-input').type("10:00");
    await page.getByRole('button').getByText("OK").click();
    expect(await page.getByText('10:40 AM').textContent()).toBe('10:40 AM');
  });
});