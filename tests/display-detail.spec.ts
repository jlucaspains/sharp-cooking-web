import { test, expect } from '@playwright/test';
import { createRecipe } from './helpers';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem("DoNotAskToInstall", "true");
    });
});

test('Highligh ingredient quantity and UOM', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    expect(await page.getByText('100g').innerHTML(), "<span class=\"text-theme-primary\">100g</span>");
});

test('Highligh step time', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    expect(await page.getByText('30 min').innerHTML(), "<span class=\"text-theme-primary\">30 min</span>");
});

test('Show ingredient detail gram', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["100g flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('100g flour').click();
    expect(await page.getByText('Quantity: 100').count()).toBe(1);
    expect(await page.getByText('UOM: gram').count()).toBe(1);
    expect(await page.getByText('Ingredient: flour').count()).toBe(1);
    expect(await page.getByText('100000milligram').count()).toBe(1);
});

test('Show ingredient detail cup', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('1 cup flour').click();
    expect(await page.getByText('Quantity: 1').count()).toBe(1);
    expect(await page.getByText('UOM: cup').count()).toBe(1);
    expect(await page.getByText('Ingredient: flour').count()).toBe(1);
    expect(await page.getByText('16tablespoon').count()).toBe(1);
    expect(await page.getByText('0.25quart').count()).toBe(1);
    expect(await page.getByText('48teaspoon').count()).toBe(1);
});

test('Show step detail time', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('Bake it for 30 min').click();
    expect(await page.getByText('Time: 30 minutes').count()).toBe(1);
});

test('Show step detail temperature F', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it at 450F for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('Bake it at 450F for 30 min').click();
    expect(await page.getByText('Time: 30 minutes').count()).toBe(1);
    expect(await page.getByText('232.2222celsius').count()).toBe(1);
});

test('Show step detail temperature C', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it at 232C for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('Bake it at 232C for 30 min').click();
    expect(await page.getByText('Time: 30 minutes').count()).toBe(1);
    expect(await page.getByText('449.6fahrenheit').count()).toBe(1);
});
