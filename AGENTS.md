# Sharp Cooking - Agent Notes

This file contains important patterns and conventions for developers and AI agents working on this codebase.

## Architecture

- **Framework**: Vue 3 with Composition API and TypeScript
- **Build Tool**: Vite
- **Routing**: Vue Router with hash-based routing (createWebHashHistory)
- **File-based Routing**: Uses vite-plugin-pages - pages in `src/pages/` are automatically registered as routes
- **State Management**: Custom reactive state via `src/services/store.ts` with Vue's provide/inject
- **i18n**: i18next with translation files in `public/locales/{locale}/translation.json`
- **UI Components**: Headless UI (@headlessui/vue) for dropdowns and menus
- **Testing**: Playwright for E2E browser tests

## Important Patterns

### Navigation Menu

- The navigation menu in TopBar.vue is configured via `state.menuOptions`
- **Critical**: `RecipeList.vue` component sets its own `menuOptions` in `onMounted()`, which **overwrites** any menu set by parent pages
- When adding menu items that should appear globally, add them to **both**:
  - `src/pages/index.vue` (for when RecipeList isn't rendered)
  - `src/components/RecipeList.vue` (for the main recipe list view)
- Menu structure supports nested items via the `children` property
- Each menu item can have an optional `svg` property for icons (inline SVG paths)

### Routing

- Routes use hash-based navigation: `/#/route-name`
- In Playwright tests, navigate to routes using the hash prefix: `page.goto('/#/export-recipe-book')`
- File-based routing: Create `.vue` files in `src/pages/` to automatically register routes
- Example: `src/pages/export-recipe-book.vue` → route `/#/export-recipe-book`

### Translations

- Translation keys follow pattern: `pages.{pageName}.{keyName}`
- Example: `t("pages.index.exportRecipeBook")`
- Translation files must be updated in locales: `en`, `pt`
- Files located in: `public/locales/{locale}/translation.json`
- Use `{{variable}}` syntax for variable interpolation (e.g., `{{count}}`)

### Recipe Data Access

- **Load recipes**: Use `getRecipes()` or `getRecipesByCategory()` from `dataService`
- **Never access recipes directly from state** - state doesn't contain a recipes array
- Cast Recipe objects to RecipeViewModel when needed by UI components
- After loading recipes, populate additional fields:
  - `recipe.image = await getRecipeMediaUrl(recipe.id || 0)`
  - `recipe.imageAvailable = recipe.image ? true : false`
  - `recipe.hasNotes = recipe.notes ? true : false`
- Recipe IDs can be undefined - filter them when needed: `.filter((id): id is number => id !== undefined)`

### Testing

- Playwright config has `webServer` option that can auto-start dev server for tests in local environment. CI runs on a deployed website.
- Tests use `getByTestId()` first then `getByRole()`, and other accessibility-friendly selectors. It is ok to modify code to add the test id.
- Always include tests for multiple browser engines: chromium, webkit, Mobile Chrome, Mobile Safari
- Test helper file: `tests/helpers.ts` provides common setup functions
- Always include `await setup(page);` on `beforeEach` hook to prevent the app from trying to install during tests.
- **NEVER** Use `page.evaluate()` to test utility functions in browser context (e.g., PDF helpers)
- **NEVER** Use `await import()` or `require()` or `page.evaluate()` for ES modules.
- **NEVER** directly access the IndexedDB when testing. **ALWAYS** use existing page functionality to setup or verify data.
- **Recipe test data**: Recipe IDs are auto-generated - don't assume specific IDs in test assertions
- Use `createRecipeWithoutSaving()` + manual save when you need control over test flow
- Some chromium tests can be flaky - run with retries if timing issues occur
- **Large datasets**: Use database helpers (`createRecipe()``) to add each recipe. You may need to expand the timeout for the test after 30 recipes.
- **Boundary testing**: Always test boundary values (e.g., 49, 50, 51 for "> 50" threshold)

### Services Layer

- **State Management**: `src/services/store.ts` provides reactive state
- **Recipe Management**: `src/services/recipe.ts` defines Recipe, RecipeImage, RecipeNutrition classes
- **Export Service**: `src/services/recipeBookExportService.ts` orchestrates PDF generation
  - Accepts RecipeBookExportRequest with selected recipes
  - Generates cover page, TOC, and recipe pages
  - Excludes nutrition facts and notes from PDF output
  - Downloads with filename format: `Sharp-Cooking-Recipe-Book-YYYY-MM-DD.pdf`

### PDF Generation

- **Libraries**: Uses jspdf (v4.0.0) and jspdf-autotable (v5.0.7)
- **Helper location**: `src/helpers/pdfHelpers.ts`
- **Image handling**: Always compress images to max 800px width using canvas (JPEG 80% quality)
- **Null safety**: Check for null/missing images before calling `doc.addImage()`
- **Page overflow**: Track `yPosition` and call `doc.addPage()` when content exceeds page height
- **Table of contents**: Use `jspdf-autotable` for structured lists
- **Text wrapping**: Use `doc.splitTextToSize()` for long text that needs to wrap
- **Progress indicators**: 
  - For long operations (10+ recipes), show progress dialog with current item and percentage
  - Export service accepts optional progress callback: `(progress: RecipeBookExportProgress) => void`
  - Progress dialog should have proper ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  - Progress bars need `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - For very fast operations, avoid showing progress to prevent UI flash

## Project Scripts

- `npm run build` - TypeScript typecheck + Vite build
- `npm run dev` - Start dev server on port 3000
- `npx vue-tsc --noEmit` - Run TypeScript type checking
- `npx playwright test {file}` - Run specific test file
