<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getRecipe, getRecipeImages } from "../../../services/dataService";
import { RecipeImage, Recipe } from "../../../services/recipe";
import { useState } from "../../../services/store";
import { RecipeViewModel } from "../recipeViewModel";

const route = useRoute();
const router = useRouter();

const id = computed(() => parseInt(<string>route.params.id));
const state = useState()!;
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  changedOn: "",
  image: "",
  imageAvailable: false,
} as RecipeViewModel);
const display = ref([{ time: "", title: "", subItems: [] as string[] }]);

onMounted(async () => {
  state.menuOptions = [
    {
      svg: `<circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" />`,
    },
  ];

  const recipe = <RecipeViewModel>await getRecipe(id.value);

  display.value = [];
  display.value.push({
    time: "11:50",
    title: "Ingredients",
    subItems: recipe.ingredients,
  });
  recipe.steps.forEach((step, index) => {
    display.value.push({
      time: "12:50",
      title: `Step ${index + 1}`,
      subItems: [step],
    });
  });

  display.value.push({
    time: "13:50",
    title: "Enjoy!",
    subItems: [],
  });

  if (recipe) {
    state.title = recipe.title;

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      recipe.image = allImages[0].image;
      recipe.imageAvailable = recipe.image ? true : false;
    }

    item.value = recipe;
  }
});

function editItem() {
  router.push(`/recipe/${id.value}/edit`);
}
</script>

<template>
  <div class="mt-16 mx-4 dark:text-white">
    <img
      :src="item.image"
      v-if="item.imageAvailable"
      class="w-full rounded-lg h-80"
    />
    <div
      v-else
      class="bg-theme-primary rounded-lg grid place-items-center h-80"
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
    <div class="w-full">
      <button
        class="p-2 w-10 h-10 m-2 bg-theme-primary rounded-full hover:bg-theme-secondary focus:ring-4 focus:ring-theme-primary focus:outline-none shadow-lg"
        @click="editItem"
      >
        <svg class="h-5 w-5 text-white" width="24"  height="24"  viewBox="0 0 24 24"  xmlns="http://www.w3.org/2000/svg"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
      </button>
      <button>action 2</button>
      <button>action 3</button>
    </div>
    <div class="grid grid-cols-8 w-full mt-7">
      <template v-for="displayItem in display">
        <div class="col-span-2 mt-3">{{ displayItem.time }}</div>
        <div class="-ml-3.5 mt-3">
          <svg
            class="h-8 w-8 text-theme-secondary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div class="col-span-5 mt-3">{{ displayItem.title }}</div>
        <template v-for="subItem in displayItem.subItems">
          <div class="col-span-2"></div>
          <div class="border-l-4 border-theme-secondary"></div>
          <div class="col-span-5">{{ subItem }}</div>
        </template>
      </template>
    </div>
    <h2 class="mt-4">Notes</h2>
    <div class="steps">
      <ul>
        <li>Some note</li>
      </ul>
    </div>
  </div>
</template>

<style>
ul li {
  border-color: white;
}
</style>
