import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("DoNotAskToInstall", "true");
  });
});

test('add new recipe', async ({ page }) => {
  await createRecipe(page, 2, "Bread 1", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 1').textContent()).toEqual('Bread 1');
});

test('create many recipes', async ({ page }) => {
  test.setTimeout(60000);
  await createRecipe(page, 2, "Bread 2", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 2').textContent()).toEqual('Bread 2');

  await createRecipe(page, 3, "Bread 3", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 3').textContent()).toEqual('Bread 3');

  await createRecipe(page, 4, "Bread 4", 5);
  await page.goto('/');
  expect(await page.getByText('Bread 4').textContent()).toEqual('Bread 4');
});

test('import from website', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('add-menu-button').click();
  await page.getByRole('menuitem', { name: 'Import from website' }).click();

  await expect(page).toHaveURL(new RegExp(/.*\/recipe\/0\/edit\?importFromUrl=1/));
});

test('import from url', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'this test doesnt work in webkit');
  const response = `
    {
        "title": "New Bread Recipe",
        "ingredients": [{
            "raw": "142g whole wheat flour"
        }],
        "steps": [{
          "raw": "Mix together the dry ingredients"
        }],
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII",
        "yields": 1,
        "nutrients": {"calories": 0}
    }`;

  await page.route('**/api/parse-recipe', async route => {
    const json = JSON.parse(response);
    await route.fulfill({ json });
  });

  await page.goto('/');

  await page.getByTestId('add-menu-button').click();
  await page.getByRole('menuitem', { name: 'Import from website' }).click();
  await page.getByTestId("import-url").fill("https://somerecipe.com/favoriteRecipe");

  await page.getByRole("button").getByText("OK").click();
  await page.waitForTimeout(1000);
  await expect(page.getByPlaceholder('1 cup flour')).toHaveValue("142g whole wheat flour");
  await expect(page.getByPlaceholder('Preheat oven to 350 F')).toHaveValue("Mix together the dry ingredients");
});

test('import from code', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'this test doesnt work in webkit');
  
  const response = `
    {
        "title": "New Bread Recipe",
        "ingredients": ["142g whole wheat flour"],
        "steps": ["Mix together the dry ingredients"],
        "media": [{"type": "img", "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"}],
        "yields": 1,
        "nutrients": {"calories": 0}
    }`;

  await page.route('**/api/receive-recipe', async route => {
    const json = JSON.parse(response);
    await route.fulfill({ json });
  });
  
  await page.goto('/');

  await page.getByTestId('add-menu-button').click();
  await page.getByRole('menuitem', { name: 'Import from share code' }).click();
  await page.getByTestId("import-code").fill("123456");

  await page.getByRole("button").getByText("OK").click();
  await page.waitForTimeout(1000);
  await expect(page.getByLabel('Title')).toHaveValue("New Bread Recipe");
  await expect(page.getByPlaceholder('1 cup flour')).toHaveValue("142g whole wheat flour");
  await expect(page.getByPlaceholder('Preheat oven to 350 F')).toHaveValue("Mix together the dry ingredients");
  await expect(page.locator('.list-images').getByRole("img")).toHaveCount(1);
});