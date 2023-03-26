import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem("DoNotAskToInstall", "true");
    });
});

async function setupImage(page) {
    await page.addInitScript(async () => {
        var url = "data:image/png;base64,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HQIQAABQhwAEAADUIQABAAB1CEAAAEAdAhAAAFCHAAQAANQhAAEAAHUIQAAAQB0CEAAAUIcABAAA1CEAAQAAdQhAAABAHQIQAABQhwAEAADUIQABAAB1CEAAAEAdAhAAAFCHAAQAANQhAAEAAHUIQAAAQB0CEAAAUIcABAAA1CEAAQAAdQhAAABAHQIQAABQhwAEAADUIQABAAB1CEAAAEAdAhAAAFCHAAQAANQhAAEAAHUIQAAAQB0CEAAAUIcABAAA1CEAAQAAdQhAAABAHQIQAABQhwAEAADUIQABAAB1CEAAAEAdAhAAAFCHAAQAANQhAAEAAHUIQAAAQB0CEAAAUIcABAAA1CEAAQAAdQhAAABAHQIQAABQhwAEAADUIQABAAB1CEAAAEAdAhAAAFCHAAQAANQhAAEAAHUIQAAAQB0CEAAAUIcABAAA1CEAAQAAdQhAAABAHQIQAABQhwAEAADUIQABAAB1CEAAAEAdAhAAAFCHAAQAANQhAAEAAHUIQAAAQB0CEAAAUIcABAAA1CEAAQAAdQhAAABAHQIQAABQhwAEAACUEfl/aNJuJmuwvfwAAAAASUVORK5CYII="

        const blob = await fetch(url)
            .then(res => res.blob());
        var file = new File([blob], "image.png", { type: "image/png" });

        const fileHandle = {
            getFile: async () => { return file; }
        };

        (window as any).showOpenFilePicker = async (param: any) => {
            return [fileHandle];
        };
    });
}

async function ReadTo(page, label) {
    await page.waitForTimeout(1000);
    await page.getByTestId('crop-image-button').click();
    await page.waitForTimeout(10000);
    await page.getByLabel(label).nth(1).check();
    await page.getByRole('button', { name: 'OK' }).click();
}

test('Read title', async ({ page, browserName, isMobile }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await setupImage(page);

    await page.goto('#/recipe/import-ocr');
    await page.getByTestId('import-button').click();
    await ReadTo(page, "Title")
    expect(await page.getByLabel('Title').inputValue()).toContain("1 cup all-purpose flour for coating");
});

test('Read ingredients', async ({ page, browserName, isMobile }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await setupImage(page);

    await page.goto('#/recipe/import-ocr');
    await page.getByTestId('import-button').click();
    await ReadTo(page, "Ingredients")
    expect(await page.getByLabel('Ingredients').inputValue()).toContain("1 cup all-purpose flour for coating");
});

test('Read steps', async ({ page, browserName, isMobile }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await setupImage(page);

    await page.goto('#/recipe/import-ocr');
    await page.getByTestId('import-button').click();
    await ReadTo(page, "Steps")
    expect(await page.getByLabel('Steps').inputValue()).toContain("1 cup all-purpose flour for coating");
});

test('Read notes', async ({ page, browserName, isMobile }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await setupImage(page);

    await page.goto('#/recipe/import-ocr');
    await page.getByTestId('import-button').click();
    await ReadTo(page, "Notes")
    expect(await page.getByLabel('Notes').inputValue()).toContain("1 cup all-purpose flour for coating");
});

test('Edit recipe', async ({ page, browserName, isMobile }) => {
    test.skip(browserName === 'webkit', 'not applicable');

    await setupImage(page);

    await page.goto('#/recipe/import-ocr');
    await page.getByTestId('import-button').click();
    await ReadTo(page, "Ingredients")
    await page.getByLabel('Title').fill("Recipe Title");
    await page.getByLabel('Steps').fill("Bake");
    await page.getByLabel('Notes').fill("Bake well");
    await page.getByTestId("topbar-single-button").click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('recipe/0/edit?ocr=1');
    expect(await page.getByLabel('Title').inputValue()).toContain('Recipe Title');
    expect(await page.getByPlaceholder('1 cup flour').inputValue()).toContain("1 cup all-purpose flour for coating");
    expect(await page.getByPlaceholder('Preheat oven to 350 F').inputValue()).toContain("Bake");
    expect(await page.getByLabel('Notes').inputValue()).toContain("Bake well");
});
