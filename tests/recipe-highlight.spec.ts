import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem("DoNotAskToInstall", "true");
    });
});

async function enableHighlighting(page: any) {
    await page.goto('#/options');
    await page.getByTestId('enable-recipe-highlight-toggle').click();
}

test('Highligh ingredient quantity and UOM', async ({ page, browserName, isMobile }) => {
    await enableHighlighting(page);
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    expect(await page.getByText('100g').innerHTML(), "<span class=\"text-theme-primary\">100g</span>");
});

test('Highligh step time', async ({ page, browserName, isMobile }) => {
    await enableHighlighting(page);
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    expect(await page.getByText('30 min').innerHTML(), "<span class=\"text-theme-primary\">30 min</span>");
});

test('Show ingredient detail', async ({ page, browserName, isMobile }) => {
    await enableHighlighting(page);
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('100g flour').click();
    expect(await page.getByText('Quantity: 100').count()).toBe(1);
    expect(await page.getByText('UOM: gram').count()).toBe(1);
    expect(await page.getByText('Ingredient: flour').count()).toBe(1);
});
