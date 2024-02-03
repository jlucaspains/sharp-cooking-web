import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("DoNotAskToInstall", "true");
  });
});

test('edit', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Bread').first().click();
  await page.getByTestId('edit-button').click();
  await expect(page).toHaveURL(new RegExp(".*recipe/1/edit"));
});

test('change size', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('/');
  await page.getByText('New Bread').first().click();
  await page.getByTestId('multiplier-button').click();
  await page.getByTestId('multiplier-value').fill("2");
  await page.getByRole('button').getByText("OK").click();
  expect(await page.getByText('200g flour').textContent()).toBe('200g flour');
});

test('change time', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');

  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('/');
  await page.getByText('New Bread').first().click();
  await page.getByTestId('time-button').click();
  await page.getByTestId('time-value').type("1000AM");
  await page.getByRole('button').getByText("OK").click();
  expect(await page.getByText('10:35 AM').textContent()).toMatch(/10:35.*/);
});

test('print recipe', async ({ page }) => {
  await createRecipe(page, 2, "Print Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  
  page.on("load", (pg) => {
    pg.evaluate("window.print = function() { console.log('Print was triggered'); };")
  });

  await page.goto('/');
  await page.getByText('Print Bread').first().click();
  await page.getByTestId('print-button').click();

  await expect(page).toHaveURL(new RegExp(/.*\/recipe\/2\/print/));
  await expect(page.getByTestId('recipe-title')).toHaveText('Print Bread');
  await expect(page.getByTestId('display-time')).toContainText('30 minutes');
  await expect(page.getByText('100g flour')).toHaveText('100g flour');
  await expect(page.getByText('Bake it for 30 min')).toHaveText('Bake it for 30 min');
  await page.waitForEvent("console", item => item.text() == "Print was triggered")
});

// test('change time webkit', async ({ page, browserName }) => {
//   test.skip(browserName !== 'webkit', 'not applicable');

//   await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
//   await page.goto('/');
//   await page.getByText('New Bread').first().click();
//   await page.getByTestId('time-button').click();
//   await page.getByTestId('time-value-input').clear();
//   await page.getByTestId('time-value-input').type("10:00");
//   await page.getByRole('button').getByText("OK").click();
//   expect(await page.getByText('10:35 AM').textContent()).toMatch(/10:35.*/);
// });

test('delete', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('/');
  await page.getByText('New Bread').first().click();
  await page.waitForTimeout(500);
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  page.getByRole('button', { name: 'Yes, delete' }).click();
  await page.waitForNavigation();
  await page.waitForTimeout(1000);
  expect(await page.isVisible("text='New Bread'")).toBe(false);
});

test('share as text', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.share = async (data?: ShareData | undefined) => {
      if (!data) {
        throw new Error("data missing");
      }

      const text = `New Bread

Ingredients:
100g flour


Instructions:
Bake it for 30 min`;

      if (data.text?.replaceAll("\r", "") !== text) {
        console.error(`text mismatch: actual: ${data.text}; expected: ${text}`);
      } else {
        console.info('All good');
      }
    }
  });

  page.on('console', msg => {
    test.fail(msg.type() == "error", "Share failed");
  });

  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('/');
  await page.getByText('New Bread').first().click();
  await page.waitForTimeout(500);
  await page.getByTestId('topbar-options').click();

  const consoleWaiter = page.waitForEvent("console", item => item.type() == "error" || item.type() == "info")
  await page.getByRole('menuitem', { name: 'Share Recipe Text' }).click();

  await consoleWaiter;
});

test('share as file', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');
  await page.addInitScript(() => {
    const comparer = '[{"id":2,"title":"New Bread","score":5,"ingredients":["100g flour",""],"steps":["Bake it for 30 min"],"multiplier":1,"media":[]}]';
    const stream = new WritableStream({
      write(chunk) {
        return new Promise(async (resolve, reject) => {
          const blob = new Blob([chunk]);
          const result = await blob.text()
          const json = JSON.parse(result);
          delete json[0].changedOn;

          if (JSON.stringify(json) !== comparer) {
            console.error("File doesn't match expectation");
          } else {
            console.info("All good");
          }

          resolve();
        });
      },
      close() { },
      abort(err) {
        console.error("Sink error:", err);
      }
    });
    (window as any).showSaveFilePicker = async (param: any) => {
      return { createWritable: async () => { return stream } };
    };
  });

  page.on('console', msg => {
    test.fail(msg.type() == "error", "Share failed");
  });

  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('/');
  await page.getByText('New Bread').first().click();
  await page.waitForTimeout(500);
  await page.getByTestId('topbar-options').click();

  const consoleWaiter = page.waitForEvent("console", item => item.type() == "error" || item.type() == "info")
  await page.getByRole('menuitem', { name: 'Share Recipe File' }).click();

  await consoleWaiter;
});