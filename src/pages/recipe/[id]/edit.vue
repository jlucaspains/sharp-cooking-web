<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import {
  getRecipe,
  saveRecipe,
  saveRecipeImage,
  getRecipeImages,
} from "../../../services/dataService";
import { RecipeImage, Recipe } from "../../../services/recipe";
import { useState } from "../../../services/store";
const state = useState()!;

const route = useRoute();

const id = computed(() => parseInt(<string>route.params.id));
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
} as Recipe);
const image = ref("");
const images = ref([] as RecipeImage[]);

onMounted(async () => {
  const recipe = await getRecipe(id.value);

  if (recipe) {
    item.value = recipe;

    state.title = recipe.title + " Edit";

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      images.value = allImages;

      image.value = allImages[0].image;
    }
  }
});

async function save() {
  const recipe = JSON.parse(JSON.stringify(item.value)); // remove proxy stuff
  await saveRecipe(recipe);

  if (image.value) {
    await saveRecipeImage(new RecipeImage(recipe.id, image.value));
  }
}

async function fileSelected(selectedFiles: FileList | null) {
  if (selectedFiles && selectedFiles.length > 0) {
    image.value = await getBase64(selectedFiles[0]);
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
  <div class="mt-16 mx-4 dark:text-white">
    <span class="dark:text-white">{{ item.title }}</span>
    <button type="button" @click="save">Save</button>
    <div>
      <img :src="image" width="320" />
      <input
        type="file"
        @change="fileSelected(($event!.target! as HTMLInputElement)!.files)"
        accept="image/*"
      />
    </div>
    <label>Title</label>
    <input
      type="text"
      v-model="item.title"
      class="block p-2 rounded text-black"
    />
    <label>Score</label>
    <input
      type="number"
      v-model.number="item.score"
      class="block p-2 rounded text-black"
    />
    <label>Ingredients</label>
    <button @click="item.ingredients.push('')">Add</button>
    <div class="flex my-3" v-for="(ingredient, index) in item.ingredients">
      <input
        type="text"
        placeholder="1 cup flour"
        v-model="item.ingredients[index]"
        class="block p-2 rounded text-black"
      />
      <button class="ml-2" @click="item.ingredients.splice(index, 1)">
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
    <button @click="item.steps.push('')">Add</button>
    <div class="flex my-3" v-for="(step, index) in item.steps">
      <input
        type="text"
        placeholder="Preheat oven to 350 F"
        v-model="item.steps[index]"
        class="block p-2 rounded text-black"
      />
      <button class="ml-2" @click="item.steps.splice(index, 1)">
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
    <input
      type="text"
      v-model="item.notes"
      class="block p-2 rounded text-black"
    />
  </div>
</template>
