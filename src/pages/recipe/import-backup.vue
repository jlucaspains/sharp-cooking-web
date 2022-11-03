<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../../services/store";
import { fileOpen, supported } from "browser-fs-access";
import { saveRecipe, saveRecipeImage } from "../../services/dataService";
import { RecipeImage } from "../../services/recipe";
import { notify } from "notiwind";
import { RecipeViewModel } from "./recipeViewModel";
import { useI18n } from "vue-i18n";

const state = useState()!;
const importItemsDisplay = ref([] as Array<{ isSelected: boolean, title: string }>);
const canSave = ref(false);
let importItems = [] as Array<RecipeViewModel>;
const { t } = useI18n();

onMounted(() => {
    state.title = t("pages.recipe.importBackup.title");
    state.menuOptions = [];
});

function saveRecipes() {
    importItems.forEach(async (recipe, index) => {
        if (!importItemsDisplay.value[index].isSelected) {
            return;
        }

        await saveRecipe(recipe);

        if (recipe.image) {
            const recipeImage = new RecipeImage(recipe.id || 0, recipe.image);
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
    if (supported) {
        console.log("Using the File System Access API.");
    } else {
        console.log("Using the fallback implementation.");
    }

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
            const data = new FormData();
            data.append('file', filePicked);

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}recipe/backup/parse`, {
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

        for (const recipe of result) {
            const parsedRecipe = new RecipeViewModel();
            parsedRecipe.title = recipe.title;
            parsedRecipe.score = 5;
            parsedRecipe.notes = recipe.notes;
            parsedRecipe.ingredients = recipe.ingredients.map((x: any) => x.raw || x);
            parsedRecipe.steps = recipe.steps.map((x: any) => x.raw || x);
            parsedRecipe.image = recipe.image;

            importItems.push(parsedRecipe);
            importItemsDisplay.value.push({ isSelected: true, title: recipe.title })
        }

        canSave.value = true;
        state.menuOptions = [{
            text: "Save",
            action: saveRecipes,
            svg: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />  <polyline points="17 21 17 13 7 13 7 21" />  <polyline points="7 3 7 8 15 8" />`,
        }];
    }
    catch {
        success = false;
    }
    finally {
        notify(
            {
                group: success ? "success" : "error",
                title: success ? t("general.done") : t("general.error"),
                text: success ? t("pages.recipe.importBackup.parsedSuccessfully") : t("pages.recipe.importBackup.parsedFailed"),
            },
            2000
        );
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
                @click="pickFile">{{ t("pages.recipe.importBackup.selectFile") }}</button>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>{{ t("pages.recipe.importBackup.step2") }}</span>
        </div>
        <div class="mt-3" v-if="canSave">
            <ul>
                <li class="mt-1"><input type="checkbox" id="importAll" @change="selectAll()" /> <label
                        for="importAll">{{ t("pages.recipe.importBackup.selectFile") }}</label></li>
                <li class="mt-1" v-for="(item, idx) in importItemsDisplay"><input type="checkbox" :id="`import-${idx}`"
                        v-model="item.isSelected" /> <label :for="`import-${idx}`">{{ item.title }}</label></li>
            </ul>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>{{ t("pages.recipe.importBackup.step3") }}</span>
        </div>
        <div role="status">
    <svg aria-hidden="true" class="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
    </svg>
    <span class="sr-only">Loading...</span>
</div>
    </div>
</template>
