<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useState } from "../../services/store";
import { fileOpen } from "browser-fs-access";
import { saveCategory, saveRecipe, saveRecipeMedia, getRecipes } from "../../services/dataService";
import { notify } from "notiwind";
import { Recipe, RecipeMedia, RecipeNutrition } from "../../services/recipe";
import { useTranslation } from "i18next-vue";
import BusyIndicator from "../../components/BusyIndicator.vue";
import Modal from "../../components/Modal.vue";
import i18next from "i18next";

interface ImportRecipeDisplay {
  isSelected: boolean;
  title: string;
  imageUrl?: string;
  isDuplicate: boolean;
  category?: string;
  recipe: any;
}

const state = useState()!;
const importItemsDisplay = ref([] as Array<ImportRecipeDisplay>);
const canSave = ref(false);
let importRecipes = [] as Array<any>;
let importCategories = [] as Array<any>;
const { t } = useTranslation();

const isBusy = ref(false);
const currentStep = ref(1);
const searchQuery = ref("");
const previewRecipe = ref<ImportRecipeDisplay | null>(null);
const isPreviewOpen = ref(false);
const importProgress = ref({ current: 0, total: 0, isImporting: false });
const existingRecipeTitles = ref(new Set<string>());

const filteredRecipes = computed(() => {
    if (!searchQuery.value) {
        return importItemsDisplay.value;
    }
    const query = searchQuery.value.toLowerCase();
    return importItemsDisplay.value.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.category?.toLowerCase().includes(query)
    );
});

const selectedCount = computed(() => {
    return importItemsDisplay.value.filter(r => r.isSelected).length;
});

onMounted(async () => {
    state.title = t("pages.recipe.importBackup.title");
    state.menuOptions = [];
    currentStep.value = 1;
    
    // Load existing recipes to check for duplicates
    const existing = await getRecipes();
    existingRecipeTitles.value = new Set(existing.map(r => r.title.toLowerCase()));
});

async function saveBackup() {
    currentStep.value = 3;
    importProgress.value.isImporting = true;
    importProgress.value.current = 0;
    
    const selectedRecipes = importItemsDisplay.value.filter(r => r.isSelected);
    importProgress.value.total = selectedRecipes.length;

    let successCount = 0;
    let failedCount = 0;

    try {
        // Save categories first
        await Promise.all(
            importCategories.map(category => saveCategory(category))
        );

        // Import recipes one by one to show progress
        for (const displayItem of selectedRecipes) {
            importProgress.value.current++;
            
            try {
                const recipe = displayItem.recipe;
                
                const parsedRecipe = new Recipe();
                parsedRecipe.title = recipe.title;
                parsedRecipe.score = recipe.score ?? 5;
                parsedRecipe.notes = recipe.notes || "";
                parsedRecipe.ingredients = recipe.ingredients.map((x: any) => x.raw || x);
                parsedRecipe.steps = recipe.steps.map((x: any) => x.raw || x);
                parsedRecipe.multiplier = recipe.multiplier ?? 1;
                parsedRecipe.nutrition = recipe.nutrition
                    ?? new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
                parsedRecipe.language = recipe.language ?? i18next.language;
                parsedRecipe.categoryId = recipe.categoryId || 0;

                const id = await saveRecipe(parsedRecipe);

                // Save media
                const media = recipe.images || recipe.media || (recipe.image ? [recipe.image] : []);
                for (const item of media) {
                    if (!item) continue;
                    const url = item.url || item;
                    const type = item.type || "img";
                    const recipeImage = new RecipeMedia(id, type, url);
                    await saveRecipeMedia(recipeImage);
                }
                
                successCount++;
            } catch (error) {
                console.error(`Failed to import recipe: ${displayItem.title}`, error);
                failedCount++;
            }
        }

        const message = failedCount > 0
            ? t("pages.recipe.importBackup.importComplete", { success: successCount, failed: failedCount })
            : t("pages.recipe.importBackup.importedSuccessfully");

        notify(
            {
                group: failedCount > 0 ? "warning" : "success",
                title: t("general.done"),
                text: message
            },
            4000
        );
    } finally {
        importProgress.value.isImporting = false;
        importProgress.value.current = 0;
        importProgress.value.total = 0;
    }
}

async function pickFile() {
    importItemsDisplay.value = [];
    importRecipes = [];
    canSave.value = false;
    isBusy.value = true;

    let success = true;

    try {
        // Open a file
        const filePicked = await fileOpen({
            mimeTypes: ["application/json"],
        });

        const textResult = await filePicked.text();
        const result = JSON.parse(textResult);

        if (Array.isArray(result)) {
            // version 1 of the backup file
            importRecipes = result;
            importCategories = [];
        } else {
            // version 2 (new) of the backup file
            importRecipes = result.recipes;
            importCategories = result.categories || [];
        }

        if (!importRecipes || importRecipes.length === 0) {
            notify(
                {
                    group: "warning",
                    title: t("general.warning"),
                    text: t("pages.recipe.importBackup.noRecipesFound"),
                },
                3000
            );
            return;
        }

        // Create category lookup
        const categoryMap = new Map(importCategories.map((c: any) => [c.id, c.name]));

        // Process recipes with images and duplicate detection
        importItemsDisplay.value = importRecipes.map(item => {
            const media = item.images || item.media || (item.image ? [item.image] : []);
            const firstMedia = media[0];
            const imageUrl = firstMedia ? (firstMedia.url || firstMedia) : undefined;
            
            return {
                isSelected: true,
                title: item.title,
                imageUrl,
                isDuplicate: existingRecipeTitles.value.has(item.title.toLowerCase()),
                category: categoryMap.get(item.categoryId),
                recipe: item
            };
        });

        canSave.value = true;
        currentStep.value = 2;

        notify(
            {
                group: "success",
                title: t("general.success"),
                text: t("pages.recipe.importBackup.parsedSuccessfully")
            },
            2000
        );

        // Scroll to step 2 after a brief delay to ensure DOM is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        const step2Element = document.querySelector('[data-step="2"]');
        if (step2Element) {
            step2Element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    catch (error) {
        success = false;
        console.error("Failed to parse backup file", error);
        notify(
            {
                group: "error",
                title: t("general.error"),
                text: t("pages.recipe.importBackup.parsedFailed"),
            },
            3000
        );
    }
    finally {
        isBusy.value = false;
    }
}

function selectAll() {
    for (const item of importItemsDisplay.value) {
        item.isSelected = true;
    }
}

function deselectAll() {
    for (const item of importItemsDisplay.value) {
        item.isSelected = false;
    }
}

function showPreview(item: ImportRecipeDisplay) {
    previewRecipe.value = item;
    isPreviewOpen.value = true;
}

function closePreview() {
    isPreviewOpen.value = false;
    previewRecipe.value = null;
}
</script>

<template>
    <div class="max-w-4xl mx-auto">
        <!-- Step 1: Select File -->
        <div class="mb-4 sm:mb-8 p-3 sm:p-6 bg-white dark:bg-theme-gray rounded-lg shadow">
            <div class="flex items-start sm:items-center mb-3 sm:mb-4">
                <div :class="[
                    'rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center border-2 shrink-0',
                    currentStep >= 1 ? 'bg-theme-primary border-theme-primary text-white' : 'border-gray-300 text-gray-400'
                ]">
                    <span class="text-base sm:text-lg font-bold">1</span>
                </div>
                <div class="ml-3 sm:ml-4 flex-1">
                    <h3 class="text-base sm:text-lg font-semibold dark:text-white">{{ t("pages.recipe.importBackup.step1") }}</h3>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{{ t("pages.recipe.importBackup.step1Description") }}</p>
                </div>
            </div>
            <button 
                class="w-full sm:w-auto bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-6 rounded"
                data-testid="import-button" 
                @click="pickFile"
                :disabled="isBusy || importProgress.isImporting">
                {{ t("pages.recipe.importBackup.selectFile") }}
            </button>
        </div>

        <!-- Step 2: Select Recipes -->
        <div v-if="canSave" data-step="2" class="mb-4 sm:mb-8 p-3 sm:p-6 bg-white dark:bg-theme-gray rounded-lg shadow">
            <div class="flex items-start sm:items-center mb-3 sm:mb-4">
                <div :class="[
                    'rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center border-2 shrink-0',
                    currentStep >= 2 ? 'bg-theme-primary border-theme-primary text-white' : 'border-gray-300 text-gray-400'
                ]">
                    <span class="text-base sm:text-lg font-bold">2</span>
                </div>
                <div class="ml-3 sm:ml-4 flex-1">
                    <h3 class="text-base sm:text-lg font-semibold dark:text-white">{{ t("pages.recipe.importBackup.step2") }}</h3>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{{ t("pages.recipe.importBackup.step2Description") }}</p>
                </div>
            </div>

            <!-- Search and Selection Controls -->
            <div class="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
                <input 
                    type="text" 
                    v-model="searchQuery"
                    :placeholder="t('pages.recipe.importBackup.searchPlaceholder')"
                    data-testid="search-recipes"
                    class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div class="flex gap-2">
                        <button 
                            @click="selectAll"
                            data-testid="select-all-button"
                            class="flex-1 sm:flex-none px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded">
                            {{ t("pages.recipe.importBackup.selectAll") }}
                        </button>
                        <button 
                            @click="deselectAll"
                            data-testid="deselect-all-button"
                            class="flex-1 sm:flex-none px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded">
                            {{ t("pages.recipe.importBackup.deselectAll") }}
                        </button>
                    </div>
                    <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-right" data-testid="selection-count">
                        {{ t("pages.recipe.importBackup.recipesSelected", { count: selectedCount, total: importItemsDisplay.length }) }}
                    </span>
                </div>
            </div>

            <!-- Recipe List -->
            <div class="space-y-2 max-h-96 overflow-y-auto">
                <div 
                    v-for="(item, idx) in filteredRecipes" 
                    :key="idx"
                    class="flex items-center p-2 sm:p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
                    :data-testid="`recipe-item-${idx}`">
                    <input 
                        type="checkbox"
                        :id="`import-${idx}`" 
                        v-model="item.isSelected"
                        class="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                    />
                    <img 
                        v-if="item.imageUrl"
                        :src="item.imageUrl"
                        :alt="item.title"
                        class="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded mr-2 sm:mr-3 shrink-0"
                        loading="lazy"
                    />
                    <div 
                        v-else
                        class="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded mr-2 sm:mr-3 flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <button
                            @click="showPreview(item)"
                            :data-testid="`preview-button-${idx}`"
                            class="text-left hover:text-theme-primary w-full">
                            <p class="text-sm sm:text-base font-medium dark:text-white truncate">{{ item.title }}</p>
                            <p v-if="item.category" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ item.category }}</p>
                        </button>
                    </div>
                    <div v-if="item.isDuplicate" class="ml-1 sm:ml-2 shrink-0">
                        <span 
                            class="inline-block text-base sm:text-lg"
                            :title="t('pages.recipe.importBackup.duplicateWarning')"
                            data-testid="duplicate-badge">
                            ⚠️
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Step 3: Confirm -->
        <div v-if="canSave" class="mb-4 sm:mb-8 p-3 sm:p-6 bg-white dark:bg-theme-gray rounded-lg shadow">
            <div class="flex items-start sm:items-center mb-3 sm:mb-4">
                <div :class="[
                    'rounded-full h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center border-2 shrink-0',
                    currentStep >= 3 ? 'bg-theme-primary border-theme-primary text-white' : 'border-gray-300 text-gray-400'
                ]">
                    <span class="text-base sm:text-lg font-bold">3</span>
                </div>
                <div class="ml-3 sm:ml-4 flex-1">
                    <h3 class="text-base sm:text-lg font-semibold dark:text-white">{{ t("pages.recipe.importBackup.step3") }}</h3>
                    <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{{ t("pages.recipe.importBackup.step3Description") }}</p>
                </div>
            </div>
            <button 
                class="w-full sm:w-auto bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded"
                data-testid="save-import-button"
                @click="saveBackup"
                :disabled="selectedCount === 0 || importProgress.isImporting">
                <span v-if="!importProgress.isImporting">{{ t("general.save") }}</span>
                <span v-else>{{ t("general.processing") }}...</span>
            </button>
        </div>

        <!-- Import Progress -->
        <div v-if="importProgress.isImporting" class="mb-4 sm:mb-8 p-3 sm:p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p class="text-center text-sm sm:text-base font-medium dark:text-white">
                {{ t("pages.recipe.importBackup.importingProgress", { current: importProgress.current, total: importProgress.total }) }}
            </p>
            <div class="mt-2 sm:mt-3 w-full bg-gray-200 rounded-full h-2 sm:h-2.5 dark:bg-gray-700">
                <div 
                    class="bg-theme-primary h-2 sm:h-2.5 rounded-full transition-all duration-300"
                    :style="{ width: `${(importProgress.current / importProgress.total) * 100}%` }">
                </div>
            </div>
        </div>

        <!-- Preview Modal -->
        <Modal 
            :isOpen="isPreviewOpen"
            :title="t('pages.recipe.importBackup.previewTitle')"
            :buttons="[{ title: 'Close', action: closePreview }]"
            @closed="closePreview">
            <div v-if="previewRecipe" class="space-y-4">
                <div v-if="previewRecipe.imageUrl" class="w-full">
                    <img 
                        :src="previewRecipe.imageUrl"
                        :alt="previewRecipe.title"
                        class="w-full h-64 object-cover rounded"
                    />
                </div>
                <div v-if="previewRecipe.category">
                    <h4 class="font-semibold dark:text-white">{{ t("pages.recipe.importBackup.category") }}</h4>
                    <p class="text-gray-700 dark:text-gray-300">{{ previewRecipe.category }}</p>
                </div>
                <div v-if="previewRecipe.recipe.ingredients?.length">
                    <h4 class="font-semibold dark:text-white">{{ t("pages.recipe.importBackup.ingredients") }}</h4>
                    <ul class="list-disc list-inside text-gray-700 dark:text-gray-300">
                        <li v-for="(ing, idx) in previewRecipe.recipe.ingredients" :key="idx">
                            {{ ing.raw || ing }}
                        </li>
                    </ul>
                </div>
                <div v-if="previewRecipe.recipe.steps?.length">
                    <h4 class="font-semibold dark:text-white">{{ t("pages.recipe.importBackup.steps") }}</h4>
                    <ol class="list-decimal list-inside text-gray-700 dark:text-gray-300">
                        <li v-for="(step, idx) in previewRecipe.recipe.steps" :key="idx">
                            {{ step.raw || step }}
                        </li>
                    </ol>
                </div>
                <div v-if="previewRecipe.recipe.notes">
                    <h4 class="font-semibold dark:text-white">{{ t("pages.recipe.importBackup.notes") }}</h4>
                    <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ previewRecipe.recipe.notes }}</p>
                </div>
            </div>
        </Modal>

        <BusyIndicator 
            :busy="isBusy" 
            :message1="t('pages.recipe.importBackup.processing1')"
            :message2="t('pages.recipe.importBackup.processing2')" 
        />
    </div>
</template>
