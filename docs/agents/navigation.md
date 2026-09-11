# Navigation Menu

- The navigation menu in `TopBar.vue` is configured via `state.menuOptions`
- **Critical**: `RecipeList.vue` component sets its own `menuOptions` in `onMounted()`, which **overwrites** any menu set by parent pages
- When adding menu items that should appear globally, add them to **both**:
  - `src/pages/index.vue` (for when `RecipeList` isn't rendered)
  - `src/components/RecipeList.vue` (for the main recipe list view)
- Menu structure supports nested items via the `children` property
- Each menu item can have an optional `svg` property for icons (inline SVG paths)
