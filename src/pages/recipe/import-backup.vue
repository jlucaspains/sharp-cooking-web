<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../../services/store";
import { fileOpen } from "browser-fs-access";
import { saveCategory, saveRecipe, saveRecipeMedia } from "../../services/dataService";
import { notify } from "../../services/notificationService";
import { Recipe, RecipeMedia, RecipeNutrition } from "../../services/recipe";
import { useTranslation } from "i18next-vue";
import BusyIndicator from "../../components/BusyIndicator.vue";
import i18next from "i18next";

const state = useState()!;
const importItemsDisplay = ref([] as Array<{ isSelected: boolean, title: string }>);
const canSave = ref(false);
let importRecipes = [] as Array<any>;
let importCategories = [] as Array<any>;
const { t } = useTranslation();

const isBusy = ref(false);

onMounted(() => {
    state.title = t("pages.recipe.importBackup.title");
    state.menuOptions = [];
});

function saveBackup() {
    importCategories.forEach(async (category) => {
        await saveCategory(category);
    });
    importRecipes.forEach(async (recipe, index) => {
        if (!importItemsDisplay.value[index].isSelected) {
            return;
        }

        const parsedRecipe = new Recipe();
        parsedRecipe.title = recipe.title;
        parsedRecipe.score = 5;
        parsedRecipe.notes = recipe.notes;
        parsedRecipe.ingredients = recipe.ingredients.map((x: any) => x.raw || x);
        parsedRecipe.steps = recipe.steps.map((x: any) => x.raw || x);
        parsedRecipe.multiplier = recipe.multiplier ?? 1;
        parsedRecipe.nutrition = recipe.nutrition
            ?? new RecipeNutrition(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        parsedRecipe.language = recipe.language
            ?? i18next.language;
        parsedRecipe.categoryId = recipe.categoryId || 0;

        const id = await saveRecipe(parsedRecipe);

        const media = recipe.images || recipe.media || [recipe.image];
        for (const item of media) {
            const url = item.url || item;
            const type = item.type || "img";
            const recipeImage = new RecipeMedia(id, type, url);
            await saveRecipeMedia(recipeImage);
        }
    });

    notify(
        {
            group: "success",
            title: t("general.done"),
            text: t("pages.recipe.importBackup.importedSuccessfully")
        },
        2000);
}

async function pickFile() {
    importItemsDisplay.value = [];
    importRecipes = [];
    canSave.value = false;

    // Open a file.
    const filePicked = await fileOpen({
        mimeTypes: ["application/json"],
    });

    let success = true;

    try {
        let result;

        const textResult = await filePicked.text();
        result = JSON.parse(textResult);

        if (Array.isArray(result)) {
            // version 1 of the backup file
            importRecipes = result;
            importCategories = [];
        } else {
            // version 2 (new) of the backup file
            importRecipes = result.recipes;
            importCategories = result.categories;
        }

        importItemsDisplay.value = importRecipes.map(item => {
            return { isSelected: true, title: item.title };
        });

        canSave.value = true;
        state.menuOptions = [{
            text: "Save",
            action: saveBackup,
            svg: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />  <polyline points="17 21 17 13 7 13 7 21" />  <polyline points="7 3 7 8 15 8" />`,
        }];
    }
    catch (error) {
        success = false;
        throw error;
    }
    finally {
        isBusy.value = false;

        if (!success) {
            notify(
                {
                    group: "error",
                    title: t("general.error"),
                    text: t("pages.recipe.importBackup.parsedFailed"),
                },
                2000
            );
        }
    }
}

function selectAll() {
    for (const item of importItemsDisplay.value) {
        item.isSelected = true;
    }
}
</script>

<template>
    <div>
        <span>{{ t("pages.recipe.importBackup.step1") }}</span>
        <div class="flex mt-3">
            <button class="bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-4 rounded-sm "
                data-testid="import-button" @click="pickFile">{{ t("pages.recipe.importBackup.selectFile") }}</button>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>{{ t("pages.recipe.importBackup.step2") }}</span>
        </div>
        <div class="mt-3" v-if="canSave">
            <ul>
                <li class="mt-1"><input type="checkbox" id="importAll" @change="selectAll()" /> <label
                        for="importAll">{{ t("pages.recipe.importBackup.selectFile") }}</label></li>
                <li class="mt-1" v-for="(item, idx) in importItemsDisplay" v-bind:key="idx"><input type="checkbox"
                        :id="`import-${idx}`" v-model="item.isSelected" /> <label :for="`import-${idx}`">{{ item.title
                        }}</label></li>
            </ul>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>{{ t("pages.recipe.importBackup.step3") }}</span>
        </div>
        <BusyIndicator :busy="isBusy" :message1="t('pages.recipe.importBackup.processing1')"
            :message2="t('pages.recipe.importBackup.processing2')" />
    </div>
</template>
