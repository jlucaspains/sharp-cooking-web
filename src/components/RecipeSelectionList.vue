<script setup lang="ts">
import { ref, computed } from "vue";
import { useTranslation } from "i18next-vue";
import { RecipeViewModel } from "../pages/recipe/recipeViewModel";

const { t } = useTranslation();

const props = defineProps<{
  recipes: RecipeViewModel[];
  selectedRecipeIds: Set<number>;
}>();

const emit = defineEmits<{
  (e: 'update:selectedRecipeIds', value: Set<number>): void;
}>();

const searchText = ref("");

const filteredRecipes = computed(() => {
  if (!searchText.value) {
    return props.recipes;
  }
  
  const search = searchText.value.toLowerCase();
  return props.recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(search)
  );
});

function toggleRecipe(recipeId: number) {
  const newSelection = new Set(props.selectedRecipeIds);
  if (newSelection.has(recipeId)) {
    newSelection.delete(recipeId);
  } else {
    newSelection.add(recipeId);
  }
  emit('update:selectedRecipeIds', newSelection);
}

function isSelected(recipeId: number): boolean {
  return props.selectedRecipeIds.has(recipeId);
}

function handleKeydown(event: KeyboardEvent, recipeId: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleRecipe(recipeId);
  }
}
</script>

<template>
  <div class="recipe-selection-list">
    <!-- Search input -->
    <div class="search-container mb-3 sm:mb-4">
      <input
        v-model="searchText"
        type="text"
        :placeholder="t('pages.exportRecipeBook.searchPlaceholder')"
        class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :aria-label="t('pages.exportRecipeBook.searchAriaLabel')"
      />
    </div>

    <!-- Recipe list -->
    <div class="recipe-list space-y-2">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-item flex items-center p-2 sm:p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 cursor-pointer transition-colors"
        @click="toggleRecipe(recipe.id!)"
        @keydown="handleKeydown($event, recipe.id!)"
        tabindex="0"
        role="checkbox"
        :aria-checked="isSelected(recipe.id!)"
        :aria-label="t('pages.exportRecipeBook.selectRecipeAriaLabel', { title: recipe.title })"
      >
        <input
          type="checkbox"
          :checked="isSelected(recipe.id!)"
          class="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded cursor-pointer"
          tabindex="-1"
          :aria-label="t('pages.exportRecipeBook.selectRecipeAriaLabel', { title: recipe.title })"
        />
        <div class="flex-1 min-w-0">
          <h3 class="text-sm sm:text-base font-medium dark:text-white text-gray-900 truncate">{{ recipe.title }}</h3>
        </div>
      </div>

      <div v-if="filteredRecipes.length === 0" class="text-center py-8 text-sm sm:text-base text-gray-500 dark:text-gray-400">
        {{ t('pages.exportRecipeBook.noRecipesFound', { searchText: searchText }) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.recipe-selection-list {
  width: 100%;
}

.recipe-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.recipe-item:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
