import { test, expect } from '@playwright/test';

async function enableChangingRecipeLanguage(page: any) {
  await page.goto('#/preview-features');
  await page.getByTestId('enable-recipe-language-toggle').click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("DoNotAskToInstall", "true");
  });
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
  expect(await page.getByText('Changed Recipe').textContent()).toEqual("Changed Recipe");
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
  expect(await page.getByText('New Ingredient').textContent()).toEqual("New Ingredient");
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
  expect(await page.getByText('New Step').textContent()).toEqual("New Step");
});

test('add image', async ({ page, browserName, isMobile }) => {
  test.skip(browserName === 'webkit', 'not applicable');

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
  expect(await page.locator('.list-images').getByRole("img").count()).toBe(2);
});

test('add video', async ({ page, browserName, isMobile }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('add-video-button').click();
  await page.getByTestId('add-video-url').fill("https://www.youtube.com/watch?v=0YY7K7Xa5rE");
  await page.getByRole("button").getByText("OK").click();

  expect(page.locator("iframe"))
    .toHaveAttribute("src", "https://www.youtube.com/embed/0YY7K7Xa5rE");
});

test('remove media', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByTestId('remove-image-button').click();
  expect(await page.locator('.list-images').getByRole("img").count()).toBe(0);
});

test('crop image cancel', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  const original = await page.locator('.list-images').getByRole("img").first().getAttribute("src");
  await page.getByTestId('crop-button').click();
  await page.getByTestId('cancel-crop-button').click();
  expect(await page.locator('.list-images').getByRole("img").count()).toBe(1);
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
  await enableChangingRecipeLanguage(page);
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
  await page.goto('/');
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Options' }).click();
  await page.getByTestId('edit-in-single-text-area-toggle').click();
  await page.goto('/');
  await page.getByText('Sourdough Bread').first().click();
  await page.getByTestId('edit-button').click();
  await page.getByLabel('Ingredients').fill('New Ingredient 1\nNew Ingredient 2');
  await page.getByLabel('Steps').fill('New Step 1\nNew Step 2');
  await page.getByTestId("topbar-single-button").click();
  await page.waitForTimeout(500);
  await page.goto('#/recipe/1');
  expect(await page.getByText('New Ingredient 1').textContent()).toEqual("New Ingredient 1");
  expect(await page.getByText('New Ingredient 2').textContent()).toEqual("New Ingredient 2");
  expect(await page.getByText('New Step 1').textContent()).toEqual("New Step 1");
  expect(await page.getByText('New Step 2').textContent()).toEqual("New Step 2");
});

test('edit ingredients and steps in multiple text boxes', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('topbar-options').click();
  await page.getByRole('menuitem', { name: 'Options' }).click();
  await page.getByTestId('edit-in-single-text-area-toggle').click();
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
  expect(await page.getByText('New Ingredient').textContent()).toEqual("New Ingredient");
  expect(await page.getByText('New Step').textContent()).toEqual("New Step");
});
