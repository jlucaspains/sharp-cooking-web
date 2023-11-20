<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import {
  getRecipe,
  getRecipeImage,
  getSetting
} from "../../../services/dataService";
import { useTranslation } from "i18next-vue";
import { useState } from "../../../services/store";
import { RecipeViewModel } from "../recipeViewModel";
import { parseInstruction } from "@jlucaspains/sharp-recipe-parser";
import i18next from "i18next";
import { secondsToString } from "../../../helpers/timeHelpers";

const { t } = useTranslation();
const route = useRoute();
const state = useState()!;

const id = computed(() => parseInt(route.params.id as string));
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  multiplier: 1,
  changedOn: "",
  image: "",
  imageAvailable: false,
  hasNotes: false
} as RecipeViewModel);
const displayTime = ref("");

onBeforeRouteLeave((to, from, next) => {
  state.useContainer = true;
  next();
});

onMounted(async () => {
  state.useContainer = false;
  state.menuOptions = [
    {
      text: t("pages.recipe.id.print.action"),
      action: () => {
        window.print();
      },
      svg: `<svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" />
          <path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" />
          <rect x="7" y="13" width="10" height="8" rx="2" />
        </svg>`,
    },
  ];

  const recipe = (await getRecipe(id.value)) as RecipeViewModel;
  const image = await getRecipeImage(id.value);
  const defaultTimeSetting = await getSetting("StepsInterval", "5");

  if (recipe) {
    state.title = recipe.title;

    item.value = recipe;
    item.value.image = image?.url;
    displayTime.value = getRecipeDisplayTime(recipe, parseInt(defaultTimeSetting));
  }

  // delay print by 500 millisseconds to allow the page to render
  // vue nextTick sometimes fail
  setTimeout(() => {
    window.print();
  }, 500);
});


function getRecipeDisplayTime(
  recipe: RecipeViewModel,
  defaultTime: number
): string {
  let totalTimeInSeconds = 0;
  for (const step of recipe.steps) {
    const result = parseInstruction(step, i18next.language);
    const time = result?.totalTimeInSeconds || (defaultTime * 60);
    totalTimeInSeconds += time;
  }

  return secondsToString(totalTimeInSeconds, t);
}
</script>

<template>
  <div class="mx-auto print-page print:-mt-16 print:-mx-4">
    <div class="grid grid-cols-12 w-full">
      <section class="col-span-6">
        <img data-testid="recipe-img" :src="item.image" alt="" />
      </section>
      <section class="col-span-6 mt-4">
        <h1 data-testid="recipe-title" class="text-center text-4xl print-title">
          {{ item.title }}
        </h1>
        <ul class="my-2 flex flex-wrap items-center justify-center">
          <li data-testid="display-time">🕛 {{ displayTime }}</li>
        </ul>
        <hr class="w-60 my-2 mx-auto border-theme-primary">
        <ul class="p-2 text-center">
          <li v-for="ingredient in item.ingredients">{{ ingredient }}</li>
        </ul>
      </section>
    </div>
    <div class="mt-5 mx-16">
      <section class="h-96 p-2">
        <h2 class="text-center text-2xl">Instructions</h2>
        <ul class="list-decimal list-outside pl-3">
          <li class="list-item list-item-lg-number mb-2 text-justify" v-for="step in item.steps">{{ step }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style>
@page :first {
  margin-top: 0;
}

@page {
  size: auto;
  margin-left: 0mm;
  margin-right: 0mm;
  margin-bottom: 1in;
  margin-top: 1in;
}

.print-title {
  font-family: 'Zeyada', cursive;
}

.print-page {
  width: 8.5in;
}
</style>