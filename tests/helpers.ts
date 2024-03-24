import { expect, Page } from '@playwright/test';

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
]) {
    await createRecipeWithoutSaving(page, title, rating, ingredients, steps);

    await page.getByTestId("topbar-single-button").click();
    await expect(page).toHaveURL(new RegExp(`.*/recipe/${id}/edit`));
}


export async function createRecipeWithoutSaving(page: Page, title: string, rating: number, ingredients: string[], steps: string[]) {
    await page.goto('/');
    await page.locator('#headlessui-menu-button-1').click();
    await page.getByRole('menuitem', { name: 'Add manually' }).click();
    await expect(page).toHaveURL('/#/recipe/0/edit');
    await page.getByLabel('Title').fill(title);
    await page.getByRole('button', { name: '⭐' }).nth(rating - 1).click();

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
