import { test, expect } from '@playwright/test';
import { setup } from './helpers';

test.beforeEach(async ({ page }) => {
    await setup(page);
});

// Helper to wait for file processing
async function waitForFileProcessed(page: any) {
    // Wait for success notification or list to appear
    await page.waitForTimeout(500);
}

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
    await waitForFileProcessed(page);
    
    // Verify recipe appears in list
    await expect(page.getByTestId("recipe-item-0")).toBeVisible();
    await expect(page.getByText('New Bread Recipe')).toBeVisible();
    
    // Verify selection count
    await expect(page.getByTestId("selection-count")).toContainText("1 of 1");
    
    await page.getByTestId("save-import-button").click();
    await page.waitForTimeout(1000); // Wait for import to complete
    
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
    await waitForFileProcessed(page);
    
    await expect(page.getByTestId("recipe-item-0")).toBeVisible();
    await page.getByTestId("save-import-button").click();
    await page.waitForTimeout(1000);
    
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
    await waitForFileProcessed(page);
    
    await expect(page.getByTestId("recipe-item-0")).toBeVisible();
    await page.getByTestId("save-import-button").click();
    await page.waitForTimeout(1000);
    
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
    await waitForFileProcessed(page);
    
    // Verify recipe appears with category
    await expect(page.getByTestId("recipe-item-0")).toBeVisible();
    const recipeItem = page.getByTestId("recipe-item-0");
    await expect(recipeItem.locator('p.text-sm').filter({ hasText: 'Bread' })).toBeVisible();
    
    await page.getByTestId("save-import-button").click();
    await page.waitForTimeout(1000);

    await page.goto('/');
    await expect(page.getByText('Bread')).toHaveText("Bread");

    await page.getByText('Bread').click();
    await expect(page.getByText('New Bread Recipe')).toHaveText("New Bread Recipe");
});

test('Test selection controls', async ({ page }) => {
    await page.addInitScript(() => {
        const blob = new Blob([`[
            {
                "id": 1,
                "title": "Recipe 1",
                "score": 5,
                "ingredients": ["flour"],
                "steps": ["bake"],
                "multiplier": 1
            },
            {
                "id": 2,
                "title": "Recipe 2",
                "score": 5,
                "ingredients": ["sugar"],
                "steps": ["mix"],
                "multiplier": 1
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
    await waitForFileProcessed(page);
    
    // Verify both recipes selected by default
    await expect(page.getByTestId("selection-count")).toContainText("2 of 2");
    
    // Test deselect all
    await page.getByTestId("deselect-all-button").click();
    await expect(page.getByTestId("selection-count")).toContainText("0 of 2");
    
    // Test select all
    await page.getByTestId("select-all-button").click();
    await expect(page.getByTestId("selection-count")).toContainText("2 of 2");
});

test('Test search functionality', async ({ page }) => {
    await page.addInitScript(() => {
        const blob = new Blob([`[
            {
                "id": 1,
                "title": "Chocolate Cake",
                "score": 5,
                "ingredients": ["chocolate"],
                "steps": ["bake"],
                "multiplier": 1
            },
            {
                "id": 2,
                "title": "Vanilla Cookies",
                "score": 5,
                "ingredients": ["vanilla"],
                "steps": ["bake"],
                "multiplier": 1
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
    await waitForFileProcessed(page);
    
    // Verify both recipes visible
    await expect(page.getByText('Chocolate Cake')).toBeVisible();
    await expect(page.getByText('Vanilla Cookies')).toBeVisible();
    
    // Search for chocolate
    await page.getByTestId("search-recipes").fill("chocolate");
    await expect(page.getByText('Chocolate Cake')).toBeVisible();
    await expect(page.getByText('Vanilla Cookies')).not.toBeVisible();
    
    // Clear search
    await page.getByTestId("search-recipes").fill("");
    await expect(page.getByText('Chocolate Cake')).toBeVisible();
    await expect(page.getByText('Vanilla Cookies')).toBeVisible();
});

test('Test recipe preview', async ({ page }) => {
    await page.addInitScript(() => {
        const blob = new Blob([`[
            {
                "id": 1,
                "title": "Test Recipe",
                "score": 5,
                "ingredients": ["flour", "water"],
                "steps": ["mix", "bake"],
                "notes": "Test notes",
                "multiplier": 1
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
    await waitForFileProcessed(page);
    
    // Click preview button
    await page.getByTestId("preview-button-0").click();
    
    // Verify modal content
    await expect(page.getByText('flour')).toBeVisible();
    await expect(page.getByText('water')).toBeVisible();
    await expect(page.getByText('Test notes')).toBeVisible();
});
