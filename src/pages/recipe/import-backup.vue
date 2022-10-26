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

    let success = false;

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
            parsedRecipe.ingredients = recipe.ingredients.map((x: any) => x.raw);
            parsedRecipe.steps = recipe.instructions.map((x: any) => x.raw);
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
        <span>{{t("pages.recipe.importBackup.step1")}}</span>
        <div class="flex mt-3">
            <button class="bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-4 rounded "
                @click="pickFile">{{t("pages.recipe.importBackup.selectFile")}}</button>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>{{t("pages.recipe.importBackup.step2")}}</span>
        </div>
        <div class="mt-3" v-if="canSave">
            <ul>
                <li class="mt-1"><input type="checkbox" id="importAll" @change="selectAll()" /> <label
                        for="importAll">{{t("pages.recipe.importBackup.selectFile")}}</label></li>
                <li class="mt-1" v-for="(item, idx) in importItemsDisplay"><input type="checkbox" :id="`import-${idx}`"
                        v-model="item.isSelected" /> <label :for="`import-${idx}`">{{item.title}}</label></li>
            </ul>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>{{t("pages.recipe.importBackup.step3")}}</span>
        </div>
    </div>
</template>
