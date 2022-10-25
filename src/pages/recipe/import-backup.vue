<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../../services/store";
import { fileOpen, supported } from "browser-fs-access";
import { saveRecipe, saveRecipeImage } from "../../services/dataService";
import { RecipeImage } from "../../services/recipe";
import { notify } from "notiwind";
import { RecipeViewModel } from "./recipeViewModel";

const state = useState()!;
const importItemsDisplay = ref([] as Array<{ isSelected: boolean, title: string }>);
const canSave = ref(false);
let importItems = [] as Array<RecipeViewModel>;

onMounted(() => {
    state.title = "Import Backup";
    state.menuOptions = [];
});

function saveRecipes() {
    console.log("saveRecipes");
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
            title: "Done",
            text: "Imported successfully"
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
            var data = new FormData();
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
                title: success ? "Done" : "Error",
                text: success ? "Parsed backup successfully" : "Failed to parse the backup file",
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
        <span>1. Select a backup, the backup must have been created by Sharp Cooking iOS, Android, or Web App and must
            be a .zip or a .json file</span>
        <div class="flex mt-3">
            <button class="bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-4 rounded "
                @click="pickFile">Select a file...</button>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>2. select which recipes to import</span>
        </div>
        <div class="mt-3" v-if="canSave">
            <ul>
                <li class="mt-1"><input type="checkbox" id="importAll" @change="selectAll()" /> <label
                        for="importAll">Select
                        all</label></li>
                <li class="mt-1" v-for="(item, idx) in importItemsDisplay"><input type="checkbox" :id="`import-${idx}`"
                        v-model="item.isSelected" /> <label :for="`import-${idx}`">{{item.title}}</label></li>
            </ul>
        </div>
        <div class="flex mt-3" v-if="canSave">
            <span>3. save</span>
        </div>
    </div>
</template>
