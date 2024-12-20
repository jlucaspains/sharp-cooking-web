import { test, expect } from '@playwright/test';
import { createRecipeWithoutSaving } from './helpers';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem("DoNotAskToInstall", "true");
    });
});

async function enableNutritionFacts(page: any) {
    await page.goto('#/preview-features');
    await page.getByTestId('enable-nutrition-facts-toggle').click();
}

test('import from url with nutrition facts', async ({ page }) => {
    await enableNutritionFacts(page);

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
          "nutrients": {"calories": 5,"totalFat":6,"saturatedFat":7,"cholesterol":8,"sodium":9,"carbohydrates":10,"fiber":11,"sugar":12,"protein":13}
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

    await expect(page.locator('div').filter({ hasText: /^Servings$/ }).getByRole('textbox')).toHaveValue("1");
    await expect(page.locator('div').filter({ hasText: /^Calories \(KCal\)$/ }).getByRole('spinbutton')).toHaveValue("5");
    await expect(page.locator('div').filter({ hasText: /^Total fat \(g\)$/ }).getByRole('spinbutton')).toHaveValue("6");
    await expect(page.locator('div').filter({ hasText: /^Saturated fat \(g\)$/ }).getByRole('spinbutton')).toHaveValue("7");
    await expect(page.locator('div').filter({ hasText: /^Cholesterol \(mg\)$/ }).getByRole('spinbutton')).toHaveValue("8");
    await expect(page.locator('div').filter({ hasText: /^Sodium \(mg\)$/ }).getByRole('spinbutton')).toHaveValue("9");
    await expect(page.locator('div').filter({ hasText: /^Carbohydrates \(g\)$/ }).getByRole('spinbutton')).toHaveValue("10");
    await expect(page.locator('div').filter({ hasText: /^Fiber \(g\)$/ }).getByRole('spinbutton')).toHaveValue("11");
    await expect(page.locator('div').filter({ hasText: /^Sugar \(g\)$/ }).getByRole('spinbutton')).toHaveValue("12");
    await expect(page.locator('div').filter({ hasText: /^Protein \(g\)$/ }).getByRole('spinbutton')).toHaveValue("13");
});

test('add new recipe with nutrition facts', async ({ page }) => {
    await enableNutritionFacts(page);

    await createRecipeWithoutSaving(page, "Bread 1", 5, [
        "1000g flour",
        "700g water",
        "15g salt",
    ], [
        "Perform first set of folds and wait 15 minutes",
        "Perform second set of folds and wait 15 minutes",
        "Perform third set of folds",
        "Ferment for 12 hours",
        "Prepare boule and set in basket",
        "Ferment for 2 hours",
        "Preheat oven at 420F",
        "Bake for 30 minutes with lid on"
    ]);

    await page.locator('div').filter({ hasText: /^Servings$/ }).getByRole('textbox').fill("1");
    await page.locator('div').filter({ hasText: /^Calories \(KCal\)$/ }).getByRole('spinbutton').fill("10");
    await page.locator('div').filter({ hasText: /^Total fat \(g\)$/ }).getByRole('spinbutton').fill("11");
    await page.locator('div').filter({ hasText: /^Saturated fat \(g\)$/ }).getByRole('spinbutton').fill("12");
    await page.locator('div').filter({ hasText: /^Cholesterol \(mg\)$/ }).getByRole('spinbutton').fill("13");
    await page.locator('div').filter({ hasText: /^Sodium \(mg\)$/ }).getByRole('spinbutton').fill("14");
    await page.locator('div').filter({ hasText: /^Carbohydrates \(g\)$/ }).getByRole('spinbutton').fill("15");
    await page.locator('div').filter({ hasText: /^Fiber \(g\)$/ }).getByRole('spinbutton').fill("15");
    await page.locator('div').filter({ hasText: /^Sugar \(g\)$/ }).getByRole('spinbutton').fill("16");
    await page.locator('div').filter({ hasText: /^Protein \(g\)$/ }).getByRole('spinbutton').fill("17");

    await page.getByTestId("topbar-single-button").click();
    await expect(page).toHaveURL(new RegExp(`.*/recipe/${2}/edit`));

    await page.goto('#/recipe/2');
    await page.getByTestId('nutrition-button').click();

    await expect(page.getByTestId('servingsPerRecipe')).toHaveText("1 Servings per recipe");
    await expect(page.getByTestId('caloriesValue')).toHaveText("10");
    await expect(page.getByTestId('totalFatValue')).toHaveText("11g grams");
    await expect(page.getByTestId('totalFatDv')).toHaveText("14%");
    await expect(page.getByTestId('saturatedFatValue')).toHaveText("12g grams");
    await expect(page.getByTestId('saturatedFatDv')).toHaveText("60%");
    await expect(page.getByTestId('cholesterolValue')).toHaveText("15mg milligrams");
    await expect(page.getByTestId('cholesterolDv')).toHaveText("5%");
    await expect(page.getByTestId('sodiumValue')).toHaveText("15mg milligrams");
    await expect(page.getByTestId('sodiumDv')).toHaveText("1%");
    await expect(page.getByTestId('carbohydratesValue')).toHaveText("15g grams");
    await expect(page.getByTestId('carbohydratesDv')).toHaveText("5%");
    await expect(page.getByTestId('fiberValue')).toHaveText("15g grams");
    await expect(page.getByTestId('fiberDv')).toHaveText("54%");
    await expect(page.getByTestId('sugarValue')).toHaveText("16g grams");
    await expect(page.getByTestId('sugarDv')).toHaveText("16%");
    await expect(page.getByTestId('proteinValue')).toHaveText("17g grams");
});

test('add new recipe without nutrition facts', async ({ page }) => {
    await enableNutritionFacts(page);

    await createRecipeWithoutSaving(page, "Bread 1", 5, [
        "1000g flour",
        "700g water",
        "15g salt",
    ], [
        "Perform first set of folds and wait 15 minutes",
        "Perform second set of folds and wait 15 minutes",
        "Perform third set of folds",
        "Ferment for 12 hours",
        "Prepare boule and set in basket",
        "Ferment for 2 hours",
        "Preheat oven at 420F",
        "Bake for 30 minutes with lid on"
    ]);

    await page.getByTestId("topbar-single-button").click();
    await expect(page).toHaveURL(new RegExp(`.*/recipe/${2}/edit`));

    await page.goto('#/recipe/2');
    await page.getByTestId('nutrition-button').click();
    await expect(page.getByText('This recipe does not have')).toHaveText('This recipe does not have nutrition facts available.');
});
