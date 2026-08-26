# Recipe Data Access

- **Load recipes**: Use `getRecipes()` or `getRecipesByCategory()` from `dataService`
- **Never access recipes directly from state** - state doesn't contain a recipes array
- Cast Recipe objects to RecipeViewModel when needed by UI components
- After loading recipes, populate additional fields:
  - `recipe.image = await getRecipeMediaUrl(recipe.id || 0)`
  - `recipe.imageAvailable = recipe.image ? true : false`
  - `recipe.hasNotes = recipe.notes ? true : false`
- Recipe IDs can be undefined - filter them when needed: `.filter((id): id is number => id !== undefined)`
