import { test, expect } from '@playwright/test';

test('Restore backup', async ({ page }) => {
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
        ]`], { type: 'text/json' });
        var file = new File([blob], "file.json", { type: "text/json" });

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