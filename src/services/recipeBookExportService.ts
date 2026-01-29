import { Recipe } from './recipe';
import {
  initializePDF,
  generateCoverPage,
  generateTableOfContents,
  generateRecipePage,
} from '../helpers/pdfHelpers';

export interface RecipeBookExportRequest {
  recipes: Recipe[];
  title?: string;
  categoryFilter?: string;
}

export interface RecipeBookExportProgress {
  currentRecipe: string;
  currentIndex: number;
  totalRecipes: number;
  percentage: number;
}

/**
 * Validate export request
 */
export function validateExportRequest(request: RecipeBookExportRequest): { valid: boolean; error?: string } {
  if (!request.recipes || request.recipes.length === 0) {
    return { valid: false, error: 'At least 1 recipe must be selected for export' };
  }
  return { valid: true };
}

/**
 * Filter recipes by category
 */
export function filterRecipesByCategory(recipes: Recipe[], categoryId?: number): Recipe[] {
  if (!categoryId) {
    return recipes;
  }
  return recipes.filter((recipe) => recipe.categoryId === categoryId);
}

/**
 * Generate filename with current date
 */
export function generateFileName(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `Sharp-Cooking-Recipe-Book-${year}-${month}-${day}.pdf`;
}

/**
 * Main export service - generates and downloads PDF
 */
export async function exportRecipeBook(
  request: RecipeBookExportRequest,
  recipeImages: Map<number, string | null> = new Map(),
  onProgress?: (progress: RecipeBookExportProgress) => void
): Promise<void> {
  // Validate request
  const validation = validateExportRequest(request);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Initialize PDF
  const doc = initializePDF();

  // Generate cover page
  const coverTitle = request.title || 'Sharp Cooking Recipe Book';
  const coverDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  generateCoverPage(doc, coverTitle, coverDate);

  // Generate table of contents
  generateTableOfContents(doc, request.recipes);

  // Generate recipe pages
  for (let i = 0; i < request.recipes.length; i++) {
    const recipe = request.recipes[i];
    const recipeImage = recipe.id ? recipeImages.get(recipe.id) ?? null : null;
    
    // Report progress if callback provided
    if (onProgress) {
      const progress: RecipeBookExportProgress = {
        currentRecipe: recipe.title || 'Untitled Recipe',
        currentIndex: i + 1,
        totalRecipes: request.recipes.length,
        percentage: Math.round(((i + 1) / request.recipes.length) * 100),
      };
      onProgress(progress);
    }
    
    await generateRecipePage(doc, recipe, recipeImage, false);
  }

  // Download PDF
  const filename = generateFileName();
  doc.save(filename);
}
