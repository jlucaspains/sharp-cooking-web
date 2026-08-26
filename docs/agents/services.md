# Services Layer

- **State Management**: `src/services/store.ts` provides reactive state
- **Recipe Management**: `src/services/recipe.ts` defines Recipe, RecipeImage, RecipeNutrition classes
- **AI Service**: `src/services/aiService.ts` provides `generateNutritionFacts()` for AI-powered nutrition calculation
  - Uses ChatOpenAI directly for simplicity
  - Returns RecipeNutrition object with all 12 nutrition fields
  - Throws AIServiceError on failures for typed error handling
- **Data Service**: `getSetting(name, defaultValue)` requires both parameters - use empty string `""` for optional settings
- **Export Service**: `src/services/recipeBookExportService.ts` orchestrates PDF generation
  - Accepts RecipeBookExportRequest with selected recipes
  - Generates cover page, TOC, and recipe pages
  - Excludes nutrition facts and notes from PDF output
  - Downloads with filename format: `Sharp-Cooking-Recipe-Book-YYYY-MM-DD.pdf`

See also: [PDF Generation](pdf-generation.md) for how the export service renders output.
