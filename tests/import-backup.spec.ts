import { test, expect } from '@playwright/test';

test('Restore json backup', async ({ page }) => {
    await page.addInitScript(() => {

        var blob = new Blob([`[
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
        var file = new File([blob], "file.json", { type: "application/json" });

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

test('Restore zip backup', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await page.addInitScript(() => {

        var blob = new Blob([], { type: 'application/zip' });
        var file = new File([blob], "file.zip", { type: "application/zip" });

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
            "images": []
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