import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("DoNotAskToInstall", "true");
  });
});

test('create backup', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');

  await page.addInitScript(() => {
    const comparer = '[{"id":1,"title":"Sourdough Bread","score":5,"ingredients":["142g whole wheat flour","312g white bread flour","7.1g salt","354g purified water","80g starter"],"steps":["Mix together the dry ingredients","Dissolve the starter into water","Add wet into dry ingredients and stir until incorporated","Cover with plastic or airtight lid and reserve for 15 minutes","Perform the first set of folds and reserve for another 15 minutes","Perform the second set of folds and reserve for another 15 minutes","Perform the third set of folds and make a window pane test. If gluten is not developed yet, repeat this step","Ferment for 10-14 hours at room temperature (68F - 72F)","Shape and proof for about 2 hours","Bake in covered dutch oven ou La Cloche at 420F for 30 minutes","Uncover and bake for another 15 minutes","Let it cool completely on cooling rack before carving"],"notes":"Whole wheat flour may be replaced with rye flour for added taste","multiplier":1,"source":"Breadtopia","images":["/bread.jpg"]}]';
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

  await page.goto('/');
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Options' }).click();
  
  const consoleWaiter = page.waitForEvent("console", item => item.type() == "error" || item.type() == "info")
  await page.getByText('Take a backup').click();
  await consoleWaiter;
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
  expect(await page.getByText('10:40 AM').textContent()).toMatch(/10:40.*/);
});

  // test('steps interval webkit', async ({ page, browserName }) => {
  //   test.skip(browserName !== 'webkit', 'not applicable');

  //   await createRecipe(page, 2, "New Bread", 5, ["1g salt"], ["Bake it for 30 min"]);
  //   await page.goto('/');
  //   await page.getByTestId('topbar-options').click();
  //   await page.getByRole('menuitem', { name: 'Options' }).click();
  //   await page.getByText('Steps Interval').click();
  //   await page.getByTestId('steps-interval-input').clear();
  //   await page.getByTestId('steps-interval-input').fill("10");
  //   await page.getByRole('button').getByText("OK").click();
  //   await page.goto('#/recipe/2');
  //   await page.getByTestId('time-button').click();
  //   await page.screenshot({ path: 'test-results/steps-webkit.png'});
  //   await page.getByTestId('time-value-input').clear();
  //   await page.getByTestId('time-value-input').type("10:00");
  //   await page.getByRole('button').getByText("OK").click();
  //   expect(await page.getByText('10:40 AM').textContent()).toMatch(/10:40.*/);
  // });