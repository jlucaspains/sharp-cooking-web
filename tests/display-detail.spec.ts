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
    await expect(page.getByText('Quantity: 100')).toHaveCount(1);
    await expect(page.getByText('UOM: gram')).toHaveCount(1);
    await expect(page.getByText('Ingredient: flour')).toHaveCount(1);
    await expect(page.getByText('100000milligram')).toHaveCount(1);
});

test('Show ingredient detail cup', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('1 cup flour').click();
    await expect(page.getByText('Quantity: 1')).toHaveCount(1);
    await expect(page.getByText('UOM: cup')).toHaveCount(1);
    await expect(page.getByText('Ingredient: flour')).toHaveCount(1);
    await expect(page.getByText('16tablespoon')).toHaveCount(1);
    await expect(page.getByText('0.25quart')).toHaveCount(1);
    await expect(page.getByText('48teaspoon')).toHaveCount(1);
});

test('Show step detail time', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('Bake it for 30 min').click();
    await expect(page.getByText('Time: 30 minutes')).toHaveCount(1);
});

test('Show step detail temperature F', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it at 450F for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('Bake it at 450F for 30 min').click();
    await expect(page.getByText('Time: 30 minutes')).toHaveCount(1);
    await expect(page.getByText('232.2222celsius')).toHaveCount(1);
});

test('Show step detail temperature C', async ({ page, browserName, isMobile }) => {
    await createRecipe(page, 2, "New Bread", 5, ["1 cup flour"], ["Bake it at 232C for 30 min"]);
    await page.goto('#/recipe/2');
    await page.getByText('Bake it at 232C for 30 min').click();
    await expect(page.getByText('Time: 30 minutes')).toHaveCount(1);
    await expect(page.getByText('449.6fahrenheit')).toHaveCount(1);
});
