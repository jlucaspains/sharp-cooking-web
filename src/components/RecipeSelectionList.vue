<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { RecipeViewModel } from "../pages/recipe/recipeViewModel";

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
    <div class="search-container mb-4">
      <input
        v-model="searchText"
        type="text"
        placeholder="Search recipes..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Search recipes"
      />
    </div>

    <!-- Recipe list -->
    <div class="recipe-list space-y-2">
      <div
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        class="recipe-item flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
        @click="toggleRecipe(recipe.id!)"
        @keydown="handleKeydown($event, recipe.id!)"
        tabindex="0"
        role="checkbox"
        :aria-checked="isSelected(recipe.id!)"
        :aria-label="`Select ${recipe.title}`"
      >
        <input
          type="checkbox"
          :checked="isSelected(recipe.id!)"
          class="mr-3 h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded cursor-pointer"
          tabindex="-1"
          :aria-label="`Select ${recipe.title}`"
        />
        <div class="flex-1">
          <h3 class="font-medium dark:text-white text-gray-900">{{ recipe.title }}</h3>
        </div>
      </div>

      <div v-if="filteredRecipes.length === 0" class="text-center py-8 text-gray-500">
        No recipes found matching "{{ searchText }}"
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
