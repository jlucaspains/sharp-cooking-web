import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem("DoNotAskToInstall", "true");
    });
});

test('Restore json backup old format', async ({ page }) => {
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
    expect(await page.getByText('New Bread Recipe').textContent()).toEqual("New Bread Recipe");
});

test('Restore json backup new format', async ({ page }) => {
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
    expect(await page.getByText('New Bread Recipe').textContent()).toEqual("New Bread Recipe");
});

test('Restore json backup with video', async ({ page }) => {
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
    expect(await page.getByText('New Bread Recipe').textContent()).toEqual("New Bread Recipe");
    await page.waitForTimeout(1000);
    expect(await page.locator("iframe"))
        .toHaveAttribute("src", "https://www.youtube.com/embed/0YY7K7Xa5rE");
});

test('Restore zip backup', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await page.addInitScript(() => {

        const blob = new Blob([], { type: 'application/zip' });
        const file = new File([blob], "file.zip", { type: "application/zip" });

        const fileHandle = {
            getFile: async () => { return file; }
        };

        (window as any).showOpenFilePicker = async (param: any) => {
            return [fileHandle];
        };
    });

    const response = `[
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
            "images": [],
            "mutrition": {"servingSize": 1, "calories": 0}
        }
    ]`;

    await page.route(/.*\/api\/process-backup/, async route => {
        const json = JSON.parse(response);
        await route.fulfill({ json });
    });

    await page.goto('#/recipe/import-backup');
    await page.getByTestId("import-button").click();
    await page.getByTestId("topbar-single-button").click();
    await page.goto('#/recipe/1');
    expect(await page.getByText('New Bread Recipe').textContent()).toEqual("New Bread Recipe");
});