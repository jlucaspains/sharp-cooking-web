<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { getRecipe, getRecipeImages } from "../../../services/dataService";
import { RecipeImage, Recipe } from "../../../services/recipe";
import { useState } from "../../../services/store";

const route = useRoute();

const id = computed(() => parseInt(<string>route.params.id));
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  changedOn: "",
} as Recipe);
const image = ref("");
const images = ref([] as RecipeImage[]);
const state = useState()!;

onMounted(async () => {
  const recipe = await getRecipe(id.value);

  if (recipe) {
    item.value = recipe;
    state.title = recipe.title;

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      images.value = allImages;

      image.value = allImages[0].image;
    }
  }
});
</script>

<template>
  <div class="mt-16 mx-4 dark:text-white">
    <router-link
      class="block py-2 pr-4 pl-3 text-white border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
      :to="`${id}/edit`"
      >Edit</router-link
    >

    <span class="dark:text-white">{{ item.title }}</span>
    <img :src="image" width="320" />
    <h2 class="mt-4">Ingredients</h2>
    <div class="ingredients">
      <ul>
        <li v-for="ingredient in item.ingredients">{{ ingredient }}</li>
      </ul>
    </div>
    <h2 class="mt-4">Step-by-Step</h2>
    <div class="steps">
      <ul>
        <li v-for="step in item.steps">{{ step }}</li>
      </ul>
    </div>
  </div>
</template>
