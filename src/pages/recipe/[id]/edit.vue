<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRecipe,
  saveRecipe,
  saveRecipeImage,
  getRecipeImages,
  getNextRecipeId
} from "../../../services/dataService";
import { RecipeImage, Recipe } from "../../../services/recipe";
import { RecipeViewModel } from "../recipeViewModel";
import { useState } from "../../../services/store";
const state = useState()!;

const route = useRoute();
const router = useRouter();

const id = computed(() => parseInt(<string>route.params.id));
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  image: "",
  imageAvailable: false,
} as RecipeViewModel);
const images = ref([] as RecipeImage[]);

onMounted(async () => {
  state.menuOptions = [
    {
      text: "Save",
      action: save,
      svg: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />  <polyline points="17 21 17 13 7 13 7 21" />  <polyline points="7 3 7 8 15 8" />`,
    },
  ];
  let recipe: RecipeViewModel;
  if (id.value === 0) {
    recipe = new RecipeViewModel();
    recipe.steps.push("");
    recipe.ingredients.push("");
  } else {
    recipe = <RecipeViewModel>await getRecipe(id.value);
  }

  if (recipe) {
    state.title = recipe.title;

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      images.value = allImages;

      recipe.image = allImages[0].image;
      recipe.imageAvailable = recipe.image ? true : false;
    }

    item.value = recipe;
  }
});

async function save() {
  const isNew = !item.value.id;
  if (isNew) {
    item.value.id = await getNextRecipeId();
  }

  // remove proxy stuff
  const recipe = JSON.parse(JSON.stringify(item.value));
  await saveRecipe(recipe);

  if (item.value.image) {
    await saveRecipeImage(new RecipeImage(recipe.id, item.value.image));
  }

  if (isNew) {
    router.replace(`/recipe/${item.value.id}/edit`);
  }
}

async function fileSelected(selectedFiles: FileList | null) {
  if (selectedFiles && selectedFiles.length > 0) {
    item.value.image = await getBase64(selectedFiles[0]);
    item.value.imageAvailable = !!item.value.image;
  }
}

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(<string>reader.result);
    reader.onerror = (error) => reject(error);
  });
}
</script>

<template>
  <div class="mt-16 mx-4 mb-10 dark:text-white">
    <!-- <div>
      <img :src="item.image" v-if="item.imageAvailable" class="w-full rounded-lg h-80" />
      <input
        type="file"
        @change="fileSelected(($event!.target! as HTMLInputElement)!.files)"
        accept="image/*"
      />
    </div>-->
    <div>
      <div
        class="rounded-lg grid place-items-center w-full h-80 overflow-hidden"
        v-if="item.imageAvailable"
      >
        <img :src="item.image" class="rounded-lg object-contain" />
      </div>
      <div
        class="bg-theme-primary rounded-lg grid place-items-center w-full h-80 overflow-hidden"
        v-else
      >
        <svg
          class="h-16 w-16 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
      <input
        type="file"
        @change="fileSelected(($event!.target! as HTMLInputElement)!.files)"
        accept="image/*"
      />
    </div>
    <label for="title">Title</label>
    <input id="title" type="text" v-model="item.title" class="block p-2 w-full rounded text-black" />
    <label>Score</label>
    <input type="number" v-model.number="item.score" class="block p-2 w-full rounded text-black" />
    <label>Ingredients</label>
    <button class="ml-2 align-middle" type="button" @click="item.ingredients.push('')">
      <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
    <div class="flex my-3 w-full" v-for="(ingredient, index) in item.ingredients">
      <input
        type="text"
        placeholder="1 cup flour"
        v-model="item.ingredients[index]"
        class="block p-2 rounded flex-auto text-black"
      />
      <button type="button" class="ml-2 align-middle" @click="item.ingredients.splice(index, 1)">
        <svg
          class="h-4 w-4 text-white"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" />
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    </div>
    <label>Steps</label>
    <button class="ml-2" type="button" @click="item.steps.push('')">
      <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
    <div class="flex my-3 w-full" v-for="(step, index) in item.steps">
      <input
        type="text"
        placeholder="Preheat oven to 350 F"
        v-model="item.steps[index]"
        class="block p-2 flex-auto rounded text-black"
      />
      <button type="button" class="ml-2" @click="item.steps.splice(index, 1)">
        <svg
          class="h-4 w-4 text-white"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" />
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    </div>
    <label>Notes</label>
    <textarea
      v-model="item.notes"
      class="block p-2 flex-auto w-full h-20 bg-white rounded text-base text-black"
    />
  </div>
</template>
