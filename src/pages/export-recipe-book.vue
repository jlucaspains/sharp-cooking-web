<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../services/store";
import { getRecipes, getRecipeMediaUrl } from "../services/dataService";
import { RecipeViewModel } from "../pages/recipe/recipeViewModel";
import RecipeSelectionList from "../components/RecipeSelectionList.vue";

const { t } = useTranslation();
const state = useState()!;
const router = useRouter();

const recipes = ref<RecipeViewModel[]>([]);
const selectedRecipeIds = ref<Set<number>>(new Set());

const selectedCount = computed(() => selectedRecipeIds.value.size);
const hasSelection = computed(() => selectedCount.value > 0);

const selectAll = () => {
  selectedRecipeIds.value = new Set(recipes.value.map((r: RecipeViewModel) => r.id).filter((id): id is number => id !== undefined));
};

const clearAll = () => {
  selectedRecipeIds.value = new Set();
};

const goBack = () => {
  router.push('/');
};

const handleExport = () => {
  // TODO: Implement PDF export in US-008
  console.log('Export', selectedRecipeIds.value);
};

onMounted(async () => {
  state.title = t("pages.exportRecipeBook.title");
  state.menuOptions = [];
  
  // Load recipes
  const allRecipes = (await getRecipes()) as RecipeViewModel[];
  
  // Load recipe images
  for (const recipe of allRecipes) {
    recipe.image = await getRecipeMediaUrl(recipe.id || 0);
    recipe.imageAvailable = recipe.image ? true : false;
    recipe.hasNotes = recipe.notes ? true : false;
  }
  
  recipes.value = allRecipes;
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

    <!-- Selection controls -->
    <div class="mb-4 flex flex-wrap gap-3 items-center">
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
      :recipes="recipes"
      :selectedRecipeIds="selectedRecipeIds"
      @update:selectedRecipeIds="selectedRecipeIds = $event"
      class="mb-6"
    />

    <!-- Export button and helper text -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-theme-gray border-t border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto">
        <button
          @click="handleExport"
          :disabled="!hasSelection"
          class="w-full px-6 py-3 rounded font-semibold transition"
          :class="{
            'bg-green-500 text-white hover:bg-green-600': hasSelection,
            'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed': !hasSelection
          }"
          :aria-label="t('pages.exportRecipeBook.exportButton')"
        >
          {{ t("pages.exportRecipeBook.exportButton") }}
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
