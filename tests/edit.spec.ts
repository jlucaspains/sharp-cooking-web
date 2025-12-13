import { test, expect } from '@playwright/test';
import { setup } from './helpers';

async function enableEditInSingleEditor(page: any) {
  await page.goto('#/options');
  await page.getByTestId('edit-in-single-text-area-toggle').click();
}

test.beforeEach(async ({ page }) => {
  await setup(page);
});

test('title', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByLabel('Title').clear();
  await page.getByLabel('Title').fill('Changed Recipe');
  await page.getByTestId("topbar-single-button").click();
  await page.waitForTimeout(500);
  await page.goto('/');
  await expect(page.getByText('Changed Recipe')).toHaveText("Changed Recipe");
});

test('add ingredient', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByPlaceholder('1 cup flour').last().press("Enter");
  await page.getByPlaceholder('1 cup flour').last().fill("New Ingredient");
  await page.getByTestId("topbar-single-button").click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/1');
  await expect(page.getByText('New Ingredient')).toHaveText("New Ingredient");
});

test('add step', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByPlaceholder('Preheat oven to 350 F').last().press("Enter");
  await page.getByPlaceholder('Preheat oven to 350 F').last().fill("New Step");
  await page.getByTestId("topbar-single-button").click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/1');
  await expect(page.getByText('New Step')).toHaveText("New Step");
});

test('add image', async ({ page }) => {
  await page.addInitScript(async () => {
    var url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"

    const blob = await fetch(url)
      .then(res => res.blob());
    var file = new File([blob], "image.png", { type: "image/png" });

    const fileHandle = {
      getFile: async () => { return file; }
    };

    (window as any).showOpenFilePicker = async (param: any) => {
      return [fileHandle];
    };
  });


  const response = `{
    "name": "recipe.png",
    "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII"
}`;

  await page.route(/.*\/api\/process-image/, async route => {
    const json = JSON.parse(response);
    await route.fulfill({ json });
  });

  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('add-image-button').click();
  await expect(page.locator('.list-images').getByRole("img")).toHaveCount(2);
});

test('add video', async ({ page, browserName, isMobile }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('add-video-button').click();
  await page.getByTestId('add-video-url').fill("https://www.youtube.com/watch?v=0YY7K7Xa5rE");
  await page.getByRole("button").getByText("OK").click();

  await expect(page.locator("iframe"))
    .toHaveAttribute("src", "https://www.youtube.com/embed/0YY7K7Xa5rE");
});

test('video media shows thumbnail', async ({ page, browserName, isMobile }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('remove-image-button').click();
  await page.getByTestId('add-video-button').click();
  await page.getByTestId('add-video-url').fill("https://www.youtube.com/watch?v=0YY7K7Xa5rE");
  await page.getByRole("button").getByText("OK").click();

  await expect(page.locator("iframe"))
    .toHaveAttribute("src", "https://www.youtube.com/embed/0YY7K7Xa5rE");

  await page.getByTestId("topbar-single-button").click();

  await page.waitForTimeout(500);

  await page.goto('/');
  await expect(page.getByTestId('recipe-image')).toHaveAttribute("src", "https://img.youtube.com/vi/0YY7K7Xa5rE/0.jpg")
});

test('remove media', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('remove-image-button').click();
  await expect(page.locator('.list-images').getByRole("img")).toHaveCount(0);
});

test('crop image cancel', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  const original = await page.locator('.list-images').getByRole("img").first().getAttribute("src");
  await page.getByTestId('crop-button').click();
  await page.getByTestId('cancel-crop-button').click();
  await expect(page.locator('.list-images').getByRole("img")).toHaveCount(1);
  const afterCropCancel = await page.locator('.list-images').getByRole("img").first().getAttribute("src");
  expect(original).toBe(afterCropCancel);
});

test('crop image', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('crop-button').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('accept-crop-button').click();
  const afterCrop = await page.locator('.list-images').getByRole("img").first().getAttribute("src");
  expect(afterCrop).toContain('data:'); // initial recipe is a file reference
});

test('change language', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('change-lang-button').click();

  expect(page.getByLabel('American English')).toBeChecked();

  await page.getByLabel('Brazilian Portuguese').check();
  await page.getByRole('button', { name: 'OK' }).click();

  await page.getByTestId("topbar-single-button").click();

  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('change-lang-button').click();

  expect(page.getByLabel('Brazilian Portuguese')).toBeChecked();
});

test('edit ingredients and steps in single text area', async ({ page }) => {
  await enableEditInSingleEditor(page);
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.locator('#ingredients').fill('New Ingredient 1\nNew Ingredient 2');
  await page.locator('#steps').fill('New Step 1\nNew Step 2');
  await page.getByTestId("topbar-single-button").click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/1');
  await expect(page.getByText('New Ingredient 1')).toHaveText("New Ingredient 1");
  await expect(page.getByText('New Ingredient 2')).toHaveText("New Ingredient 2");
  await expect(page.getByText('New Step 1')).toHaveText("New Step 1");
  await expect(page.getByText('New Step 2')).toHaveText("New Step 2");
});

test('edit ingredients and steps in multiple text boxes', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByPlaceholder('1 cup flour').last().press("Enter");
  await page.getByPlaceholder('1 cup flour').last().fill("New Ingredient");
  await page.getByPlaceholder('Preheat oven to 350 F').last().press("Enter");
  await page.getByPlaceholder('Preheat oven to 350 F').last().fill("New Step");
  await page.getByTestId("topbar-single-button").click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/1');
  await expect(page.getByText('New Ingredient')).toHaveText("New Ingredient");
  await expect(page.getByText('New Step')).toHaveText("New Step");
});
