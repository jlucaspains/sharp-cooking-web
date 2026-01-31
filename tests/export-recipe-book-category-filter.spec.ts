import { test, expect } from '@playwright/test';
import { createCategory, createRecipe } from './helpers';

test.beforeEach(async ({ page, context }) => {
  await page.goto('/');
});

test('should display category filter dropdown', async ({ page }) => {
  await page.goto('/#/export-recipe-book');

  const categoryFilter = page.locator('#category-filter');
  await expect(categoryFilter).toBeVisible();

  // Should have "All Categories" option by default
  const selectedOption = await categoryFilter.locator('option:checked').textContent();
  expect(selectedOption).toContain('All Categories');
});

test('should list all categories in dropdown', async ({ page, context }) => {
  // Create categories
  await createCategory(page, 1, 'Desserts');
  await createCategory(page, 2, 'Main Courses');

  // Create recipes for each category
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 3, 'Pasta Carbonara', 5, ['100g pasta'], ['Cook and mix'], true, 'Main Courses');

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000); // Wait for categories to load

  const categoryFilter = page.locator('#category-filter');
  const options = await categoryFilter.locator('option').allTextContents();

  expect(options.length).toBeGreaterThanOrEqual(3); // All + 2 categories
  expect(options.some(opt => opt.includes('Desserts'))).toBeTruthy();
  expect(options.some(opt => opt.includes('Main Courses'))).toBeTruthy();
});

test('should filter recipes by selected category', async ({ page, context }) => {
  // Create categories
  await createCategory(page, 1, 'Desserts');
  await createCategory(page, 2, 'Main Courses');

  // Create recipes for each category
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 3, 'Pasta Carbonara', 5, ['100g pasta'], ['Cook and mix'], true, 'Main Courses');
  await createRecipe(page, 4, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true, 'Desserts');

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  // Initially should show all recipes
  let recipeItems = page.locator('.recipe-item');
  await expect(recipeItems).toHaveCount(4);

  // Select "Desserts" category
  const categoryFilter = page.locator('#category-filter');
  await categoryFilter.selectOption({ label: "Desserts (2)" });
  await page.waitForTimeout(1000);

  // Should show only 2 dessert recipes
  recipeItems = page.locator('.recipe-item');
  await expect(recipeItems).toHaveCount(2);

  const recipeTitles = await recipeItems.locator('h3').allTextContents();
  expect(recipeTitles).toContain('Chocolate Cake');
  expect(recipeTitles).toContain('Vanilla Cookies');
  expect(recipeTitles).not.toContain('Pasta Carbonara');
});

test('should allow selecting all filtered recipes', async ({ page, context }) => {
  // Create categories
  await createCategory(page, 1, 'Desserts');
  await createCategory(page, 2, 'Main Courses');

  // Create recipes
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 3, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 4, 'Pasta Carbonara', 5, ['100g pasta'], ['Cook and mix'], true, 'Main Courses');

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  // Filter by Desserts
  const categoryFilter = page.locator('#category-filter');
  await categoryFilter.selectOption({ label: "Desserts (2)" });
  await page.waitForTimeout(300);

  // Click Select All
  await page.getByRole('button', { name: /Select All/i }).click();

  // Should show 2 recipes selected (only filtered ones)
  const selectedCount = page.locator('text=/2 recipes selected/i');
  await expect(selectedCount).toBeVisible();

  // Export button should be enabled
  const exportButton = page.getByRole('button', { name: /Export PDF/i });
  await expect(exportButton).toBeEnabled();
});

test('should preserve selection when changing category filter', async ({ page, context }) => {
  // Create categories
  await createCategory(page, 1, 'Desserts');
  await createCategory(page, 2, 'Main Courses');

  // Create recipes
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 3, 'Pasta Carbonara', 5, ['100g pasta'], ['Cook and mix'], true, 'Main Courses');

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  // Select first recipe
  const firstRecipe = page.locator('.recipe-item').first();
  await firstRecipe.click();

  // Verify selection count
  await expect(page.locator('text=/1 recipes selected/i')).toBeVisible();

  // Change category filter
  const categoryFilter = page.locator('#category-filter');
  await categoryFilter.selectOption({ label: "Main Courses (1)" });
  await page.waitForTimeout(300);

  // Selection count should still be 1 (preserved)
  await expect(page.locator('text=/1 recipes selected/i')).toBeVisible();

  // Change back to All Categories
  await categoryFilter.selectOption({ value: '' });
  await page.waitForTimeout(300);

  // Selection should still be preserved
  await expect(page.locator('text=/1 recipes selected/i')).toBeVisible();
});

test('should show all recipes when "All Categories" is selected', async ({ page, context }) => {
  // Create categories
  await createCategory(page, 1, 'Desserts');
  await createCategory(page, 2, 'Main Courses');

  // Create recipes
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 3, 'Pasta Carbonara', 5, ['100g pasta'], ['Cook and mix'], true, 'Main Courses');

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  // Filter by category first
  const categoryFilter = page.locator('#category-filter');
  await categoryFilter.selectOption({ label: "Desserts (1)" });
  await page.waitForTimeout(300);

  // Should show only 1 recipe
  let recipeItems = page.locator('.recipe-item');
  await expect(recipeItems).toHaveCount(1);

  // Switch back to All Categories
  await categoryFilter.selectOption({ value: '' });
  await page.waitForTimeout(300);

  // Should show all 2 recipes
  recipeItems = page.locator('.recipe-item');
  await expect(recipeItems).toHaveCount(3);
});

test('should show recipe count for each category', async ({ page, context }) => {
  // Create categories
  await createCategory(page, 1, 'Desserts');
  await createCategory(page, 2, 'Main Courses');

  // Create 3 recipes in Desserts category
  await createRecipe(page, 2, 'Chocolate Cake', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 3, 'Vanilla Cookies', 5, ['150g flour'], ['Mix and bake'], true, 'Desserts');
  await createRecipe(page, 4, 'Strawberry Pie', 5, ['200g flour'], ['Mix and bake'], true, 'Desserts');

  await page.goto('/#/export-recipe-book');
  await page.waitForTimeout(1000);

  const categoryFilter = page.locator('#category-filter');
  const options = await categoryFilter.locator('option').allTextContents();

  // Should show recipe count for category
  const dessertOption = options.find(opt => opt.includes('Desserts'));
  expect(dessertOption).toContain('(3)');
});
