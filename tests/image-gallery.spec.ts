import { test, expect } from '@playwright/test';
import { setup } from './helpers';

test.beforeEach(async ({ page }) => {
  await setup(page);
});

// The recipe view wraps the gallery in an `lg:sticky` aside. `position: sticky` creates a
// stacking context, which used to trap the expanded overlay below the fixed top bar at >= lg
// and hide the close button. The overlay is teleported to <body> while open to avoid that.
const viewports = [
  { name: 'below lg', width: 900, height: 800 },
  { name: 'at lg and above', width: 1440, height: 900 },
];

for (const vp of viewports) {
  test(`expanded image fills the screen undistorted and can be closed (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await page.goto('/#/recipe/1/view');
    await page.waitForSelector('.list-images li a');

    await page.locator('.list-images li a').first().click();
    await expect(page.getByTestId('image-gallery-close')).toBeVisible();

    const info = await page.evaluate(() => {
      const root = document.querySelector('.gallery-open') as HTMLElement;
      const svg = root.querySelector('[data-testid="image-gallery-close"]')!;
      const rb = svg.getBoundingClientRect();
      const topMost = document.elementFromPoint(rb.x + rb.width / 2, rb.y + rb.height / 2)!;
      const img = root.querySelector('img') as HTMLImageElement;
      const ir = img.getBoundingClientRect();
      return {
        overlayParent: root.parentElement!.tagName,
        closeButtonIsOnTop: root.contains(topMost),
        renderedRatio: +(ir.width / ir.height).toFixed(3),
        naturalRatio: +(img.naturalWidth / img.naturalHeight).toFixed(3),
        fitsViewport: ir.width <= window.innerWidth + 1 && ir.height <= window.innerHeight + 1,
        fillsOneAxis: Math.abs(ir.width - window.innerWidth) < 60 || Math.abs(ir.height - window.innerHeight) < 130,
      };
    });

    // teleported out of the sticky aside, so nothing can paint over the close button
    expect(info.overlayParent).toBe('BODY');
    expect(info.closeButtonIsOnTop).toBe(true);
    // no distortion, and no overflow in either direction
    expect(info.renderedRatio).toBe(info.naturalRatio);
    expect(info.fitsViewport).toBe(true);
    expect(info.fillsOneAxis).toBe(true);

    await page.getByTestId('image-gallery-close').click();
    await expect(page.locator('.gallery-open')).toHaveCount(0);
  });
}

test('inline hero image keeps its cropped banner size when not expanded', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/');
  await page.goto('/#/recipe/1/view');
  await page.waitForSelector('.list-images li a');

  const height = await page.evaluate(() =>
    Math.round(document.querySelector('.list-images img')!.getBoundingClientRect().height));

  expect(height).toBe(208); // 13rem hero crop
});
