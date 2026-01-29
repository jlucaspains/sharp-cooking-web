import { expect, type Page, type BrowserContext } from '@playwright/test';
import { Recipe } from '../src/services/recipe';
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

export async function setupTestRecipes(page: Page) {
    // Create test recipes for export tests - don't use specific IDs
    await createRecipeWithoutSaving(page, 'Test Recipe 1', 5, ["1000g flour", "700g water"], ["Mix ingredients", "Bake for 30 minutes"], true, null);
    await page.getByTestId("topbar-single-button").click();
    await page.waitForTimeout(500);
    
    await page.goto('/');
    await createRecipeWithoutSaving(page, 'Test Recipe 2', 4, ["500g flour"], ["Mix", "Bake"], true, null);
    await page.getByTestId("topbar-single-button").click();
    await page.waitForTimeout(500);
    
    await page.goto('/');
    await createRecipeWithoutSaving(page, 'Test Recipe 3', 3, ["100g sugar"], ["Mix sugar", "Cook"], true, null);
    await page.getByTestId("topbar-single-button").click();
    await page.waitForTimeout(500);
}

export async function cleanupTestRecipes(page: Page) {
    // Clean up test data by clearing IndexedDB
    await page.evaluate(() => {
        return new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase('SharpCooking');
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
        });
    });
}

export async function clearDatabase(context: BrowserContext) {
    const page = await context.newPage();
    await page.goto('/');
    
    // Clear the database
    await page.evaluate(() => {
        return new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase('RecipeDatabase');
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => {
                setTimeout(() => resolve(), 1000);
            };
        });
    });
    
    // Wait a bit for DB to fully clear
    await page.waitForTimeout(500);
    
    // Clear all recipes from the now-reinitialized database
    await page.evaluate(async () => {
        const { default: Dexie } = await import('/node_modules/dexie/dist/dexie.mjs');
        const db = new Dexie('RecipeDatabase');
        db.version(6).stores({
            recipes: "++id,title,score,changedOn,categoryId",
            recipeImages: "++id,recipeId",
            recipeMedia: "++id,recipeId",
            settings: "name",
            categories: "++id,name"
        });
        await db.recipes.clear();
        await db.categories.clear();
        await db.recipeMedia.clear();
    });
    
    await page.close();
}

export function createRecipeData(title: string, rating: number = 5): Recipe {
    const recipe = new Recipe();
    recipe.title = title;
    recipe.score = rating;
    recipe.ingredients = ["1000g flour", "700g water", "15g salt"];
    recipe.steps = ["Mix ingredients", "Bake for 30 minutes"];
    recipe.multiplier = 1;
    recipe.categoryId = 0;
    recipe.changedOn = new Date().toISOString();
    return recipe;
}

export async function saveRecipe(context: BrowserContext, recipe: Recipe): Promise<number> {
    const page = await context.newPage();
    await page.goto('/');
    
    const recipeId = await page.evaluate(async (recipeData: any) => {
        const { saveRecipe, getNextRecipeId } = await import('/src/services/dataService.ts');
        const { Recipe, RecipeNutrition } = await import('/src/services/recipe.ts');
        
        const recipe = new Recipe();
        recipe.id = recipeData.id || await getNextRecipeId();
        recipe.title = recipeData.title;
        recipe.score = recipeData.score;
        recipe.ingredients = recipeData.ingredients;
        recipe.steps = recipeData.steps;
        recipe.multiplier = recipeData.multiplier;
        recipe.categoryId = recipeData.categoryId;
        recipe.changedOn = recipeData.changedOn;
        recipe.nutrition = new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        
        return await saveRecipe(recipe);
    }, recipe);
    
    await page.close();
    return recipeId;
}

export function createCategoryData(name: string): Category {
    const category = new Category();
    category.id = Math.floor(Math.random() * 1000000) + 1; // Random ID
    category.name = name;
    return category;
}

export async function saveCategory(context: BrowserContext, category: Category): Promise<number> {
    const page = await context.newPage();
    await page.goto('/');
    
    const categoryId = await page.evaluate(async (categoryData: any) => {
        const { saveCategory } = await import('/src/services/dataService.ts');
        const { Category } = await import('/src/services/category.ts');
        
        const category = new Category();
        category.id = categoryData.id;
        category.name = categoryData.name;
        
        return await saveCategory(category);
    }, category);
    
    await page.close();
    return categoryId;
}