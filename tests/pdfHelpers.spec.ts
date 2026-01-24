import { test, expect } from '@playwright/test';

test.describe('PDF Helpers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
  });

  test('should generate cover page with title', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateCoverPage } = await import('../src/helpers/pdfHelpers');
      const doc = initializePDF();
      generateCoverPage(doc, 'My Recipe Book');
      return { success: true };
    });
    
    expect(result.success).toBe(true);
  });

  test('should generate cover page with title and date', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateCoverPage } = await import('../src/helpers/pdfHelpers');
      const doc = initializePDF();
      generateCoverPage(doc, 'My Recipe Book', '2026-01-24');
      return { success: true };
    });
    
    expect(result.success).toBe(true);
  });

  test('should generate table of contents with recipes', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateTableOfContents } = await import('../src/helpers/pdfHelpers');
      const { Recipe } = await import('../src/services/recipe');
      
      const doc = initializePDF();
      const recipes = [
        Object.assign(new Recipe(), { title: 'Recipe 1', ingredients: [], steps: [] }),
        Object.assign(new Recipe(), { title: 'Recipe 2', ingredients: [], steps: [] }),
        Object.assign(new Recipe(), { title: 'Recipe 3', ingredients: [], steps: [] }),
      ];
      
      generateTableOfContents(doc, recipes);
      return { success: true, pageCount: doc.getNumberOfPages() };
    });
    
    expect(result.success).toBe(true);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  test('should generate recipe page with title, image, ingredients, and steps', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateRecipePage } = await import('../src/helpers/pdfHelpers');
      const { Recipe } = await import('../src/services/recipe');
      
      const doc = initializePDF();
      const recipe = Object.assign(new Recipe(), {
        title: 'Chocolate Cake',
        ingredients: ['2 cups flour', '1 cup sugar', '1/2 cup cocoa powder', '1 tsp baking soda'],
        steps: ['Preheat oven to 350°F', 'Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes'],
      });
      
      // Create a small test image (1x1 red pixel)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 1, 1);
      }
      const testImage = canvas.toDataURL('image/png');
      
      await generateRecipePage(doc, recipe, testImage, true);
      return { success: true, pageCount: doc.getNumberOfPages() };
    });
    
    expect(result.success).toBe(true);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
  });

  test('should handle image compression for large images', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { compressImage } = await import('../src/helpers/pdfHelpers');
      
      // Create a test image larger than 800px
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, 1200, 1200);
      }
      const largeImage = canvas.toDataURL('image/png');
      
      const compressedImage = await compressImage(largeImage, 800);
      
      // Verify compressed image is smaller
      return {
        success: true,
        originalSize: largeImage.length,
        compressedSize: compressedImage.length,
        isSmaller: compressedImage.length < largeImage.length
      };
    });
    
    expect(result.success).toBe(true);
    expect(result.isSmaller).toBe(true);
  });

  test('should handle recipes without images gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateRecipePage } = await import('../src/helpers/pdfHelpers');
      const { Recipe } = await import('../src/services/recipe');
      
      const doc = initializePDF();
      const recipe = Object.assign(new Recipe(), {
        title: 'Simple Salad',
        ingredients: ['Lettuce', 'Tomatoes', 'Cucumber'],
        steps: ['Wash vegetables', 'Chop ingredients', 'Mix in bowl'],
      });
      
      await generateRecipePage(doc, recipe, null, true);
      return { success: true, pageCount: doc.getNumberOfPages() };
    });
    
    expect(result.success).toBe(true);
    expect(result.pageCount).toBe(1);
  });

  test('should handle invalid image data gracefully', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateRecipePage } = await import('../src/helpers/pdfHelpers');
      const { Recipe } = await import('../src/services/recipe');
      
      const doc = initializePDF();
      const recipe = Object.assign(new Recipe(), {
        title: 'Test Recipe',
        ingredients: ['Ingredient 1'],
        steps: ['Step 1'],
      });
      
      // Pass invalid image data
      await generateRecipePage(doc, recipe, 'invalid-image-data', true);
      return { success: true };
    });
    
    expect(result.success).toBe(true);
  });

  test('should handle long recipe titles with text wrapping', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateRecipePage } = await import('../src/helpers/pdfHelpers');
      const { Recipe } = await import('../src/services/recipe');
      
      const doc = initializePDF();
      const recipe = Object.assign(new Recipe(), {
        title: 'This is a Very Long Recipe Title That Should Wrap to Multiple Lines When Rendered in the PDF Document',
        ingredients: ['Ingredient 1'],
        steps: ['Step 1'],
      });
      
      await generateRecipePage(doc, recipe, null, true);
      return { success: true };
    });
    
    expect(result.success).toBe(true);
  });

  test('should handle recipes with many ingredients and steps', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { initializePDF, generateRecipePage } = await import('../src/helpers/pdfHelpers');
      const { Recipe } = await import('../src/services/recipe');
      
      const doc = initializePDF();
      const recipe = Object.assign(new Recipe(), {
        title: 'Complex Recipe',
        ingredients: Array.from({ length: 30 }, (_, i) => `Ingredient ${i + 1} - with some description text`),
        steps: Array.from({ length: 25 }, (_, i) => `Step ${i + 1}: This is a detailed step with multiple lines of text that explains what to do in great detail.`),
      });
      
      await generateRecipePage(doc, recipe, null, true);
      return { success: true, pageCount: doc.getNumberOfPages() };
    });
    
    expect(result.success).toBe(true);
    expect(result.pageCount).toBeGreaterThan(1); // Should span multiple pages
  });
});
