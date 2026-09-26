import { test, expect } from '@playwright/test';
import { createRecipe, setup, enableNewDisplayView, enableDietTags } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
});

test('recipe list links to the new display view page when enabled', async ({ page }) => {
  await enableNewDisplayView(page);
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);

  await page.goto('/');
  await page.getByText('New Bread').first().click();

  await expect(page).toHaveURL(new RegExp(".*recipe/2/view"));
});

test('recipe list links to the regular page when new display view is disabled', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);

  await page.goto('/');
  await page.getByText('New Bread').first().click();

  await expect(page).toHaveURL(/.*recipe\/2$/);
});

test('toggle step completion', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Mix ingredients", "Bake for 30 min"]);
  await page.goto('#/recipe/2/view');

  const step1Checkbox = page.locator('[aria-label="Step 1"]');

  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'false');

  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'true');

  const svg = step1Checkbox.locator('svg[fill="currentColor"]');
  await expect(svg).toBeVisible();

  await step1Checkbox.click();
  await expect(step1Checkbox).toHaveAttribute('aria-checked', 'false');
});

test('multiple steps can be marked complete', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Step one", "Step two", "Step three"]);
  await page.goto('#/recipe/2/view');

  await page.locator('[aria-label="Step 1"]').click();
  await page.locator('[aria-label="Step 3"]').click();

  await expect(page.locator('[aria-label="Step 1"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[aria-label="Step 2"]')).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[aria-label="Step 3"]')).toHaveAttribute('aria-checked', 'true');
});

test('ingredients render as a plain list without a completion checkbox', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour", "50g water"], ["Mix", "Bake"]);
  await page.goto('#/recipe/2/view');

  await expect(page.getByText('100g flour')).toBeVisible();
  await expect(page.getByText('50g water')).toBeVisible();

  // Unlike the regular recipe page, the wide view has no ingredients completion toggle.
  await expect(page.locator('[aria-label="Ingredients"]')).toHaveCount(0);

  // Step checkboxes are still present.
  await expect(page.locator('[role="checkbox"]')).toHaveCount(2);
});

test('edit button navigates to the edit page', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('#/recipe/2/view');

  await page.getByTestId('edit-button').click();

  await expect(page).toHaveURL(new RegExp(".*recipe/2/edit"));
});

test('change size updates ingredient quantities', async ({ page }) => {
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('#/recipe/2/view');

  await page.getByTestId('multiplier-button').click();
  await page.getByTestId('multiplier-value').fill("2");
  await page.getByRole('button').getByText("OK").click();

  await expect(page.getByText('200g flour')).toHaveText('200g flour');
});

test('change time', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');

  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('#/recipe/2/view');

  await page.getByTestId('time-button').click();
  await page.getByTestId('time-value').type("1000AM");
  await page.getByRole('button').getByText("OK").click();

  expect(await page.getByText('10:35 AM').first().textContent()).toMatch(/10:35.*/);
});

test('print recipe', async ({ page }) => {
  await enableNewDisplayView(page);
  await createRecipe(page, 2, "Print Bread", 5, ["100g flour"], ["Bake it for 30 min"]);

  page.on("load", (pg) => {
    pg.evaluate("window.print = function() { console.log('Print was triggered'); };")
  });

  await page.goto('/');
  await page.getByText('Print Bread').first().click();
  await expect(page).toHaveURL(new RegExp(".*recipe/2/view"));
  await page.getByTestId('print-button').click();

  await expect(page).toHaveURL(new RegExp(/.*\/recipe\/2\/print/));
  await expect(page.getByTestId('recipe-title')).toHaveText('Print Bread');
  await expect(page.getByTestId('display-time')).toContainText('30 minutes');
  await expect(page.getByText('100g flour')).toHaveText('100g flour');
  await expect(page.getByText('Bake it for 30 min')).toHaveText('Bake it for 30 min');
  await page.waitForEvent("console", item => item.text() == "Print was triggered")
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
  await page.goto('#/recipe/2/view');

  const consoleWaiter = page.waitForEvent("console", item => item.type() == "error" || item.type() == "info")
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Share Recipe Text' }).click();

  await consoleWaiter;
});

test('share as file', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'not applicable');
  await page.addInitScript(() => {
    const comparer = '{"recipes":[{"id":2,"title":"New Bread","score":5,"ingredients":["100g flour"],"steps":["Bake it for 30 min"],"notes":"","multiplier":1,"nutrition":{"servingSize":0,"totalFat":0,"saturatedFat":0,"sodium":0,"protein":0,"cholesterol":0,"calories":0,"carbohydrates":0,"fiber":0,"sugar":0,"transFat":0,"unsaturatedFat":0},"categoryId":0,"tags":[],"media":[]}],"categories":[],"version":2}';
    const stream = new WritableStream({
      write(chunk) {
        return new Promise(async (resolve, reject) => {
          const blob = new Blob([chunk]);
          const result = await blob.text()
          const json = JSON.parse(result);
          delete json.recipes[0].changedOn;

          if (JSON.stringify(json) !== comparer) {
            console.error(JSON.stringify(json));
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
  await page.goto('#/recipe/2/view');

  const consoleWaiter = page.waitForEvent("console", item => item.type() == "error" || item.type() == "info")
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Share Recipe File' }).click();

  await consoleWaiter;
});

test('share as code', async ({ page }) => {
  const response = `{"id": "123456", "qr_code": "<svg></svg>", "ttl": 3600}`;

  await page.route('**/api/share-recipe', async route => {
    const json = JSON.parse(response);
    await route.fulfill({ json });
  });

  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
  await page.goto('#/recipe/2/view');

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Share via share code' }).click();
  await expect(page.getByTestId("actual-share-code")).toHaveText("123456");
});

test('Recipe with diet tags shows tag icons on the view page', async ({ page }) => {
  await enableDietTags(page);
  await createRecipe(page, 2, 'Tagged Recipe', 5);
  await page.getByTestId('tag-toggle-vegan').click();
  await page.getByTestId('tag-toggle-gluten-free').click();
  await page.getByTestId('topbar-single-button').click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/2/view');

  await expect(page.getByTestId('edit-button')).toBeVisible();
  await expect(page).toHaveURL(/.*\/recipe\/2\/view$/);
  await expect(page.getByRole('img', { name: 'Vegan' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Gluten free' })).toBeVisible();
});

test('Recipe with no diet tags shows no tag icons', async ({ page }) => {
  await enableDietTags(page);
  await createRecipe(page, 2, 'Untagged Recipe', 5);
  await page.getByTestId('topbar-single-button').click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/2/view');

  await expect(page.getByTestId('edit-button')).toBeVisible();
  await expect(page).toHaveURL(/.*\/recipe\/2\/view$/);
  await expect(page.getByRole('img', { name: 'Vegan' })).not.toBeVisible();
});

test('delete removes the recipe', async ({ page }) => {
  await enableNewDisplayView(page);
  await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);

  await page.goto('/');
  await page.getByText('New Bread').first().click();
  await expect(page).toHaveURL(new RegExp(".*recipe/2/view"));
  await page.waitForTimeout(500);

  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  page.getByRole('button', { name: 'Yes, delete' }).click();

  await page.waitForNavigation();
  await page.waitForTimeout(1000);

  expect(await page.isVisible("text='New Bread'")).toBe(false);
});
