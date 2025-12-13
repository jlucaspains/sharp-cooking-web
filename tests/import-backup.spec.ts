import { test, expect } from '@playwright/test';
import { setup } from './helpers';

test.beforeEach(async ({ page }) => {
    await setup(page);
});

test('Restore v1 json backup old format', async ({ page }) => {
    await page.addInitScript(() => {

        const blob = new Blob([`[
            {
                "id": 1,
                "title": "New Bread Recipe",
                "score": 5,
                "changedOn": "2022-12-29T00:35:42.073Z",
                "source": "Breadtopia",
                "ingredients": [
                    "142g whole wheat flour"
                ],
                "steps": [
                    "Mix together the dry ingredients"
                ],
                "notes": "May replace whole wheat flour with rye for added taste",
                "multiplier": 1,
                "image": "/bread.jpg",
                "imageAvailable": true,
                "images": []
            }
        ]`], { type: 'application/json' });
        const file = new File([blob], "file.json", { type: "application/json" });

        const fileHandle = {
            getFile: async () => { return file; }
        };

        (window as any).showOpenFilePicker = async (param: any) => {
            return [fileHandle];
        };
    });

    await page.goto('#/recipe/import-backup');
    await page.getByTestId("import-button").click();
    await page.getByTestId("topbar-single-button").click();
    await page.goto('#/recipe/1');
    await expect(page.getByText('New Bread Recipe')).toHaveText("New Bread Recipe");
});

test('Restore v1 json backup new format', async ({ page }) => {
    await page.addInitScript(() => {

        const blob = new Blob([`[
            {
                "id": 1,
                "title": "New Bread Recipe",
                "score": 5,
                "changedOn": "2022-12-29T00:35:42.073Z",
                "source": "Breadtopia",
                "ingredients": [
                    "142g whole wheat flour"
                ],
                "steps": [
                    "Mix together the dry ingredients"
                ],
                "notes": "May replace whole wheat flour with rye for added taste",
                "multiplier": 1,
                "media": [{"type":"img", "url":"/bread.jpg"}]
            }
        ]`], { type: 'application/json' });
        const file = new File([blob], "file.json", { type: "application/json" });

        const fileHandle = {
            getFile: async () => { return file; }
        };

        (window as any).showOpenFilePicker = async (param: any) => {
            return [fileHandle];
        };
    });

    await page.goto('#/recipe/import-backup');
    await page.getByTestId("import-button").click();
    await page.getByTestId("topbar-single-button").click();
    await page.goto('#/recipe/1');
    await expect(page.getByText('New Bread Recipe')).toHaveText("New Bread Recipe");
});

test('Restore v1 json backup with video', async ({ page }) => {
    await page.addInitScript(() => {

        const blob = new Blob([`[
            {
                "id": 1,
                "title": "New Bread Recipe",
                "score": 5,
                "changedOn": "2022-12-29T00:35:42.073Z",
                "source": "Breadtopia",
                "ingredients": [
                    "142g whole wheat flour"
                ],
                "steps": [
                    "Mix together the dry ingredients"
                ],
                "notes": "May replace whole wheat flour with rye for added taste",
                "multiplier": 1,
                "media": [{"type":"vid", "url":"https://www.youtube.com/embed/0YY7K7Xa5rE"}]
            }
        ]`], { type: 'application/json' });
        const file = new File([blob], "file.json", { type: "application/json" });

        const fileHandle = {
            getFile: async () => { return file; }
        };

        (window as any).showOpenFilePicker = async (param: any) => {
            return [fileHandle];
        };
    });

    await page.goto('#/recipe/import-backup');
    await page.getByTestId("import-button").click();
    await page.getByTestId("topbar-single-button").click();
    await page.goto('#/recipe/1');
    await expect(page.getByText('New Bread Recipe')).toHaveText("New Bread Recipe");
    await page.waitForTimeout(1000);
    await expect(page.locator("iframe"))
        .toHaveAttribute("src", "https://www.youtube.com/embed/0YY7K7Xa5rE");
});

test('Restore v2 json backup new format', async ({ page }) => {
    await page.addInitScript(() => {

        const blob = new Blob([`{
    "recipes": [
        {
            "id": 2,
            "title": "New Bread Recipe",
            "score": 5,
            "ingredients": [
                "142g whole wheat flour",
                "312g white bread flour",
                "7.1g salt",
                "354g purified water",
                "80g starter"
            ],
            "steps": [
                "bake"
            ],
            "notes": "",
            "multiplier": 1,
            "nutrition": {
                "servingSize": 0,
                "totalFat": 0,
                "saturatedFat": 0,
                "sodium": 0,
                "protein": 0,
                "cholesterol": 0,
                "calories": 0,
                "carbohydrates": 0,
                "fiber": 0,
                "sugar": 0,
                "transFat": 0,
                "unsaturatedFat": 0
            },
            "categoryId": 1,
            "media": [],
            "category": "Bread"
        }
    ],
    "categories": [
        {
            "name": "Bread",
            "image": "https://via.placeholder.com/150",
            "id": 1
        }
    ],
    "version": 2
}`], { type: 'application/json' });
        const file = new File([blob], "file.json", { type: "application/json" });

        const fileHandle = {
            getFile: async () => { return file; }
        };

        (window as any).showOpenFilePicker = async (param: any) => {
            return [fileHandle];
        };
    });

    await page.goto('#/options');
    await page.getByTestId('enable-category-toggle').click();

    await page.goto('#/recipe/import-backup');
    await page.getByTestId("import-button").click();
    await page.getByTestId("topbar-single-button").click();

    await page.goto('/');
    await expect(page.getByText('Bread')).toHaveText("Bread");

    await page.getByText('Bread').click();
    await expect(page.getByText('New Bread Recipe')).toHaveText("New Bread Recipe");
});
