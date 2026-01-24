<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../services/store";
import { getRecipes, getRecipeMediaUrl, getCategories } from "../services/dataService";
import { RecipeViewModel } from "../pages/recipe/recipeViewModel";
import { Category } from "../services/category";
import RecipeSelectionList from "../components/RecipeSelectionList.vue";
import { exportRecipeBook, type RecipeBookExportProgress } from "../services/recipeBookExportService";
import type { Recipe } from "../services/recipe";

const { t } = useTranslation();
const state = useState()!;
const router = useRouter();

const allRecipes = ref<RecipeViewModel[]>([]);
const categories = ref<Category[]>([]);
const selectedCategoryId = ref<number | null>(null);
const selectedRecipeIds = ref<Set<number>>(new Set());
const showSuccessMessage = ref(false);
const isExporting = ref(false);
const exportProgress = ref<RecipeBookExportProgress | null>(null);
const showLargeExportWarning = computed(() => selectedCount.value > 50);

const filteredRecipes = computed(() => {
  if (selectedCategoryId.value === null || selectedCategoryId.value === 0) {
    return allRecipes.value;
  }
  return allRecipes.value.filter(r => r.categoryId === selectedCategoryId.value);
});

const selectedCount = computed(() => selectedRecipeIds.value.size);
const hasSelection = computed(() => selectedCount.value > 0);
const hasRecipes = computed(() => allRecipes.value.length > 0);
const errorMessage = ref<string | null>(null);

const selectAll = () => {
  selectedRecipeIds.value = new Set(filteredRecipes.value.map((r: RecipeViewModel) => r.id).filter((id): id is number => id !== undefined));
};

const clearAll = () => {
  selectedRecipeIds.value = new Set();
};

const handleCategoryChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;
  selectedCategoryId.value = value === "" ? null : parseInt(value);
};

const goBack = () => {
  router.push('/');
};

const handleExport = async () => {
  if (!hasSelection.value) return;
  
  try {
    isExporting.value = true;
    showSuccessMessage.value = false;
    exportProgress.value = null;
    errorMessage.value = null;
    
    // Get selected recipes
    const selectedRecipes = allRecipes.value
      .filter((r: RecipeViewModel) => r.id !== undefined && selectedRecipeIds.value.has(r.id))
      .map((r: RecipeViewModel) => {
        // Convert RecipeViewModel back to Recipe (only fields needed for PDF)
        const recipe: Recipe = {
          id: r.id,
          title: r.title || '',
          ingredients: r.ingredients || [],
          steps: r.steps || [],
          categoryId: r.categoryId,
          // Note: DO NOT include nutrition or notes - per acceptance criteria
        } as Recipe;
        return recipe;
      });
    
    // Create recipe images map
    const recipeImages = new Map<number, string | null>();
    for (const recipe of allRecipes.value) {
      if (recipe.id !== undefined) {
        recipeImages.set(recipe.id, recipe.image || null);
      }
    }
    
    // Show progress dialog for 10+ recipes
    const showProgress = selectedRecipes.length >= 10;
    
    // Export the recipe book with progress callback
    await exportRecipeBook(
      {
        recipes: selectedRecipes,
      },
      recipeImages,
      showProgress ? (progress) => {
        exportProgress.value = progress;
      } : undefined
    );
    
    // Show success message
    showSuccessMessage.value = true;
    exportProgress.value = null;
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      showSuccessMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('Error exporting recipe book:', error);
    errorMessage.value = t("pages.exportRecipeBook.exportError");
    
    // Hide error message after 5 seconds
    setTimeout(() => {
      errorMessage.value = null;
    }, 5000);
  } finally {
    isExporting.value = false;
    exportProgress.value = null;
  }
};

onMounted(async () => {
  state.title = t("pages.exportRecipeBook.title");
  state.menuOptions = [];
  
  // Load categories
  categories.value = await getCategories();
  
  // Load recipes
  const recipes = (await getRecipes()) as RecipeViewModel[];
  
  // Load recipe images
  for (const recipe of recipes) {
    recipe.image = await getRecipeMediaUrl(recipe.id || 0);
    recipe.imageAvailable = recipe.image ? true : false;
    recipe.hasNotes = recipe.notes ? true : false;
  }
  
  allRecipes.value = recipes;
});
</script>

<template>
  <div class="bg-white text-slate-900 dark:bg-theme-gray dark:text-white min-h-screen p-4">
    <!-- Header with back button -->
    <div class="mb-6">
      <button
        @click="goBack"
        class="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        aria-label="Back to recipe list"
      >
        ← {{ t("pages.exportRecipeBook.back") }}
      </button>
      <h1 class="text-2xl font-bold">{{ t("pages.exportRecipeBook.title") }}</h1>
    </div>

    <!-- Category filter -->
    <div class="mb-4" v-if="hasRecipes">
      <label for="category-filter" class="block text-sm font-medium mb-2">
        {{ t("pages.exportRecipeBook.filterByCategory") }}
      </label>
      <select
        id="category-filter"
        @change="handleCategoryChange"
        class="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        :aria-label="t('pages.exportRecipeBook.filterByCategory')"
      >
        <option value="">{{ t("pages.exportRecipeBook.allCategories") }}</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }} ({{ category.recipeCount }})
        </option>
      </select>
    </div>

    <!-- Empty state -->
    <div v-if="!hasRecipes" class="flex flex-col items-center justify-center py-12">
      <svg class="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {{ t("pages.exportRecipeBook.emptyState") }}
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        {{ t("pages.exportRecipeBook.emptyStateDescription") }}
      </p>
      <button
        @click="goBack"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        {{ t("pages.exportRecipeBook.back") }}
      </button>
    </div>

    <!-- Selection controls -->
    <div class="mb-4 flex flex-wrap gap-3 items-center" v-if="hasRecipes">
      <button
        @click="selectAll"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        :aria-label="t('pages.exportRecipeBook.selectAll')"
      >
        {{ t("pages.exportRecipeBook.selectAll") }}
      </button>
      <button
        @click="clearAll"
        class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        :aria-label="t('pages.exportRecipeBook.clearAll')"
      >
        {{ t("pages.exportRecipeBook.clearAll") }}
      </button>
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {{ t("pages.exportRecipeBook.selectedCount", { count: selectedCount }) }}
      </span>
    </div>

    <!-- Recipe selection list -->
    <RecipeSelectionList
      v-if="hasRecipes"
      :recipes="filteredRecipes"
      :selectedRecipeIds="selectedRecipeIds"
      @update:selectedRecipeIds="selectedRecipeIds = $event"
      class="mb-6"
    />

    <!-- Success message -->
    <div
      v-if="showSuccessMessage"
      class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg"
      role="alert"
      aria-live="polite"
    >
      {{ t("pages.exportRecipeBook.successMessage") }}
    </div>

    <!-- Error message -->
    <div
      v-if="errorMessage"
      class="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 bg-red-500 text-white rounded-lg shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      {{ errorMessage }}
    </div>

    <!-- Progress dialog -->
    <div
      v-if="exportProgress"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="progress-title"
      aria-modal="true"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 id="progress-title" class="text-xl font-semibold mb-4">
          {{ t("pages.exportRecipeBook.exportingProgress") }}
        </h2>
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-2">
            <span>{{ t("pages.exportRecipeBook.processing", { name: exportProgress.currentRecipe, current: exportProgress.currentIndex, total: exportProgress.totalRecipes }) }}</span>
            <span class="font-semibold">{{ exportProgress.percentage }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              class="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              :style="{ width: exportProgress.percentage + '%' }"
              role="progressbar"
              :aria-valuenow="exportProgress.percentage"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export button and helper text -->
    <div v-if="hasRecipes" class="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-theme-gray border-t border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto">
        <!-- Warning for large exports -->
        <div
          v-if="showLargeExportWarning"
          class="mb-3 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded text-yellow-800 dark:text-yellow-200 text-sm"
          role="alert"
        >
          ⚠️ {{ t("pages.exportRecipeBook.largeExportWarning") }}
        </div>
        <button
          @click="handleExport"
          :disabled="!hasSelection || isExporting"
          class="w-full px-6 py-3 rounded font-semibold transition"
          :class="{
            'bg-green-500 text-white hover:bg-green-600': hasSelection && !isExporting,
            'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed': !hasSelection || isExporting
          }"
          :aria-label="t('pages.exportRecipeBook.exportButton')"
        >
          {{ isExporting ? t("pages.exportRecipeBook.exporting") : t("pages.exportRecipeBook.exportButton") }}
        </button>
        <p
          v-if="!hasSelection"
          class="text-sm text-gray-500 dark:text-gray-400 text-center mt-2"
        >
          {{ t("pages.exportRecipeBook.selectAtLeastOne") }}
        </p>
      </div>
    </div>

    <!-- Add padding at bottom to account for fixed button -->
    <div class="h-24"></div>
  </div>
</template>
