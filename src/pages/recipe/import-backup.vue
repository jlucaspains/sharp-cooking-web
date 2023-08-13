<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../../services/store";
import { fileOpen } from "browser-fs-access";
import { saveRecipe, saveRecipeImage } from "../../services/dataService";
import { notify } from "notiwind";
import { Recipe, RecipeImage } from "../../services/recipe";
import { useTranslation } from "i18next-vue";
import BusyIndicator from "../../components/BusyIndicator.vue";
import { fetchWithRetry } from "../../services/fetchWithRetry";

const state = useState()!;
const importItemsDisplay = ref([] as Array<{ isSelected: boolean, title: string }>);
const canSave = ref(false);
let importItems = [] as Array<any>;
const { t } = useTranslation();

const isBusy = ref(false);

onMounted(() => {
    state.title = t("pages.recipe.importBackup.title");
    state.menuOptions = [];
});

function saveRecipes() {
    importItems.forEach(async (recipe, index) => {
        if (!importItemsDisplay.value[index].isSelected) {
            return;
        }

        const parsedRecipe = new Recipe();
        parsedRecipe.title = recipe.title;
        parsedRecipe.score = 5;
        parsedRecipe.notes = recipe.notes;
        parsedRecipe.ingredients = recipe.ingredients.map((x: any) => x.raw || x);
        parsedRecipe.steps = recipe.steps.map((x: any) => x.raw || x);

        const id = await saveRecipe(parsedRecipe);

        const images = recipe.images || [recipe.image];
        for (const image of images) {
            const recipeImage = new RecipeImage(id, null, image);
            await saveRecipeImage(recipeImage);
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
    importItems = [];
    canSave.value = false;

    // Open a file.
    const filePicked = await fileOpen({
        mimeTypes: ["application/zip", "application/json"],
    });

    let success = true;

    try {
        let result;

        if (filePicked.name.endsWith(".zip")) {
            isBusy.value = true;
            const data = new FormData();
            data.append('file', filePicked);

            const response = await fetchWithRetry("/api/process-backup", {
                method: "POST",
                body: data
            });

            success = response.ok;
            if (!success) {
                return;
            }

            result = await response.json();
        } else {
            const textResult = await filePicked.text();
            result = JSON.parse(textResult);
        }

        importItems = result;
        importItemsDisplay.value = importItems.map(item => {
            return { isSelected: true, title: item.title };
        });

        canSave.value = true;
        state.menuOptions = [{
            text: "Save",
            action: saveRecipes,
            svg: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />  <polyline points="17 21 17 13 7 13 7 21" />  <polyline points="7 3 7 8 15 8" />`,
        }];
    }
    catch (error) {
        success = false;
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
            <button class="bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-4 rounded "
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
