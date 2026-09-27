import { test, expect, type Page } from '@playwright/test';
import {
  createRecipe,
  setup,
  enableCloudSync,
  installFakeCloudProvider,
  createFakeRemoteStore,
  type FakeRemoteStore,
} from './helpers';

// Simulates a second "device": a fresh browser context (its own IndexedDB) wired to the
// same fake remote store as the first page, so syncing both pages exercises the real
// two-way merge in src/services/sync/syncService.ts without needing real OneDrive/MSAL.
async function setupDevice(page: Page, store: FakeRemoteStore) {
  await setup(page);
  await installFakeCloudProvider(page, store);
  await enableCloudSync(page);
}

async function syncNow(page: Page) {
  await page.goto('/#/cloud-sync');
  await page.getByTestId('onedrive-sync-now-button').click();
  await page.waitForSelector('text=/Sync complete/i');
}

test('syncs a new recipe to a second device', async ({ browser }) => {
  const store = createFakeRemoteStore();

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await setupDevice(pageA, store);

  await createRecipe(pageA, 2, 'Sync Bread', 5);
  await syncNow(pageA);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await setupDevice(pageB, store);

  await syncNow(pageB);
  await pageB.goto('/');
  await expect(pageB.getByText('Sync Bread')).toHaveText('Sync Bread');

  await contextA.close();
  await contextB.close();
});

test('propagates a deletion to a second device', async ({ browser }) => {
  const store = createFakeRemoteStore();

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await setupDevice(pageA, store);

  await createRecipe(pageA, 2, 'Delete Bread', 5);
  await syncNow(pageA);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await setupDevice(pageB, store);
  await syncNow(pageB);
  await pageB.goto('/');
  await expect(pageB.getByText('Delete Bread')).toHaveText('Delete Bread');

  // Delete on device A and push the tombstone.
  await pageA.goto('/');
  await pageA.getByText('Delete Bread').first().click();
  await pageA.waitForTimeout(500);
  await pageA.getByTestId('topbar-options').click();
  await pageA.getByRole('menuitem', { name: 'Delete' }).click();
  await pageA.getByRole('button', { name: 'Yes, delete' }).click();
  await pageA.waitForNavigation();
  await syncNow(pageA);

  // Device B should pick up the deletion.
  await syncNow(pageB);
  await pageB.goto('/');
  expect(await pageB.isVisible("text='Delete Bread'")).toBe(false);

  await contextA.close();
  await contextB.close();
});
