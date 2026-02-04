import { expect, type Page } from '@playwright/test';
import { Category } from '../src/services/category';

export async function createRecipe(page: Page, id: number, title: string, rating: number, ingredients = [
    "1000g flour",
    "700g water",
    "15g salt",
], steps = [
    "Perform first set of folds and wait 15 minutes",
    "Perform second set of folds and wait 15 minutes",
    "Perform third set of folds",
    "Ferment for 12 hours",
    "Prepare boule and set in basket",
    "Ferment for 2 hours",
    "Preheat oven at 420F",
    "Bake for 30 minutes with lid on"
], startFromHome: boolean = true,
    category: string | null = null) {
    await createRecipeWithoutSaving(page, title, rating, ingredients, steps, startFromHome, category);
    await page.getByTestId("topbar-single-button").click();
    await expect(page).toHaveURL(new RegExp(`.*/recipe/${id}/edit`));
}

export async function createRecipeWithoutSaving(page: Page, title: string, rating: number, ingredients: string[], steps: string[], startFromHome: boolean = true, category: string | null = null) {
    if (startFromHome) {
        await page.goto('/');
        await page.getByTestId('add-menu-button').click();
        await page.getByRole('menuitem', { name: 'Add manually' }).click();
        await expect(page).toHaveURL('/#/recipe/0/edit');
    } else {
        await page.goto('/#/recipe/0/edit');
    }

    await page.getByLabel('Title').fill(title);
    await page.getByRole('button', { name: '⭐' }).nth(rating - 1).click();

    if (category) {
        await page.getByLabel('Category').selectOption({ label: category ?? "None" });
    }

    for (const item of ingredients) {
        await page.getByPlaceholder('1 cup flour').last().fill(item);

        if (ingredients.indexOf(item) + 1 != ingredients.length) {
            await page.getByPlaceholder('1 cup flour').last().press("Enter");
        }
    }

    for (const item of steps) {
        await page.getByPlaceholder('Preheat oven to 350 F').last().fill(item);

        if (steps.indexOf(item) + 1 != steps.length) {
            await page.getByPlaceholder('Preheat oven to 350 F').last().press("Enter");
        }
    }
}

export async function createCategory(page: Page, id: number, title: string) {
    await page.goto('/#/categories');
    await page.waitForTimeout(500);
    await page.getByTestId('add-menu-button').click();
    await page.getByTestId('new-category-name').fill(title);
    await page.getByText('OK').click();
}

export async function setup(page: Page) {
    await page.addInitScript(() => {
        window.localStorage.setItem("DoNotAskToInstall", "true");
    });
    await preventPageStats(page);
}

export async function preventPageStats(page: Page) {
    await page.route(/.*\/pageview/, async route => {
        await route.fulfill({ status: 200, body: 'OK' });
    });
    await page.route(/.*\/pageViewDuration/, async route => {
        await route.fulfill({ status: 200, body: 'OK' });
    });
}

export async function enableCompactMobileTimeline(page: Page) {
    await page.goto('#/preview-features');
    await page.getByTestId('enable-compact-mobile-timeline-toggle').click();
}

export async function enableAIChat(page: Page) {
    await page.goto('#/preview-features');
    await page.getByTestId('enable-ai-chat-toggle').click();
}

export async function configureAI(page: Page, apiKey: string = 'test-api-key', modelName: string = 'gpt-4') {
    await page.goto('/#/ai-options');
    await page.waitForLoadState('networkidle');
    
    // Fill in AI settings
    const authInput = page.locator('input[placeholder="token"]');
    const modelInput = page.locator('input[placeholder="Model Name"]');
    
    await authInput.fill(apiKey);
    await authInput.blur(); // Trigger change event
    
    await modelInput.fill(modelName);
    await modelInput.blur(); // Trigger change event
    
    await page.waitForTimeout(500); // Wait for settings to save
}

export function createCategoryData(name: string): Category {
    const category = new Category();
    category.id = Math.floor(Math.random() * 1000000) + 1; // Random ID
    category.name = name;
    return category;
}