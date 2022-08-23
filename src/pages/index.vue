<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";
import { useState } from "../services/store";
import { getRecipes, getRecipeImage } from "../services/dataService";
import { Recipe } from "../services/recipe";
import { RecipeViewModel } from "./recipe/recipeViewModel";
import debounce from "lodash.debounce";

const router = useRouter();
const { t } = useI18n();
const state = useState()!;

const items = ref([] as RecipeViewModel[]);
const searchText = ref("");
const isOpen = ref(false);
let allRecipes = [] as RecipeViewModel[];
let debouncedWatch: (currentValue: string, oldValue: string) => void;

function sortByTitle(items: Array<RecipeViewModel>) {
  return items.sort((a, b) => {
    const al = a.title.toLowerCase();
    const bl = b.title.toLowerCase();

    if (al < bl) return -1;
    else if (al > bl) return 1;
    return 0;
  });
}

function sortByRating(items: Array<RecipeViewModel>) {
  return items.sort((a, b) => {
    return a.score - b.score;
  });
}

function sortByDate(items: Array<RecipeViewModel>) {
  return items; // TODO: implement
}

onMounted(async () => {
  state.title = "All Recipes";
  state.menuOptions = [
    {
      svg: `<path stroke="none" d="M0 0h24v24H0z"/>  <line x1="4" y1="6" x2="13" y2="6" />  <line x1="4" y1="12" x2="11" y2="12" />  <line x1="4" y1="18" x2="11" y2="18" />  <polyline points="15 15 18 18 21 15" />  <line x1="18" y1="6" x2="18" y2="18" />`,
      children: [
        {
          text: "By Title",
          action: () => {
            items.value = sortByTitle(items.value);
          },
        },
        {
          text: "By Rating",
          action: () => {
            items.value = sortByRating(items.value);
          },
        },
        {
          text: "By Recipe Date",
          action: () => {
            items.value = sortByDate(items.value);
          },
        },
      ],
    },
  ];

  debouncedWatch = debounce((currentValue: string, oldValue: string) => {
    items.value = allRecipes.filter((item) =>
      item.title.toLowerCase().includes(currentValue.toLowerCase())
    );
  }, 200);

  allRecipes = (await getRecipes()) as RecipeViewModel[];

  for (const recipe of allRecipes) {
    const item = await getRecipeImage(recipe.id || 0);
    recipe.image = item && item.image;
    recipe.imageAvailable = recipe.image ? true : false;
  }

  items.value = allRecipes;
});

watch(searchText, (currentValue, oldValue) => {
  debouncedWatch(currentValue, oldValue);
});

function goToRecipe(id: number) {
  router.push(`/recipe/${id}`);
}

function gotToNew() {
  router.push("/recipe/0/edit");
}
</script>

<template>
  <div class="mt-16 bg-white text-slate-900 dark:bg-theme-gray dark:text-white">
    <div class="flex flex-col mb-2 md:hidden">
      <input
        type="text"
        :placeholder="t('recipes.search')"
        v-model="searchText"
        class="mx-4 p-2 my-2 rounded text-black"
      />
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 m-4 gap-5">
      <div
        v-for="item in items"
        @click="goToRecipe(item.id || 0)"
        @keydown.enter="goToRecipe(item.id || 0)"
        tabindex="0"
        class="p-5 h-60 rounded-lg shadow bg-white dark:bg-theme-secondary-gray overflow-hidden"
      >
        <div
          style="height: calc(100% - 0.5rem)"
          class="-mx-5 -mt-5 overflow-hidden"
        >
          <img
            v-if="item.imageAvailable"
            :src="item.image"
            class="object-contain"
          />
          <div v-else class="bg-theme-primary h-full grid place-items-center">
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
        </div>
        <div class="h-full pt-2">
          <span class="text-ellipsis text-black dark:text-white text-lg">{{
            item.title
          }}</span>
          <span class="float-right text-black dark:text-white"
            >{{ item.score }}⭐</span
          >
        </div>
      </div>
    </div>
    <button
      @click="gotToNew()"
      class="p-0 w-14 h-14 fixed bottom-6 right-6 bg-theme-primary rounded-full hover:bg-theme-secondary focus:ring-4 focus:ring-theme-primary focus:outline-none shadow-lg"
    >
      <svg
        viewBox="0 0 20 20"
        enable-background="new 0 0 20 20"
        class="w-6 h-6 inline-block"
      >
        <path
          fill="#FFFFFF"
          d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                C15.952,9,16,9.447,16,10z"
        />
      </svg>
    </button>
  </div>
</template>
