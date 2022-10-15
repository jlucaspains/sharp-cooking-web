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
import { RecipeViewModel } from "./recipe/recipeViewModel";
import debounce from "lodash.debounce";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const router = useRouter();
const { t } = useI18n();
const state = useState()!;

const items = ref([] as RecipeViewModel[]);
const searchText = ref("");
const isOpen = ref(false);
let allRecipes = [] as RecipeViewModel[];
let debouncedWatch: (currentValue: string, oldValue: string) => void;
const addOptions = [
  {
    name: "AddManual",
    text: "Add manually",
    action: goToNew,
  },
  {
    name: "ImportFromWebsite",
    text: "Import from website",
    action: goToImport,
  },
  {
    name: "ImportFromBackup",
    text: "Import from backup file",
    action: goToImportFromBackup,
  },
];

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

function goToNew() {
  router.push("/recipe/0/edit");
}
function goToImport() {
  router.push("/recipe/0/edit?import=1");
}
function goToImportFromBackup() {
  router.push("/recipe/import-backup");
}
</script>

<template>
  <div class="bg-white text-slate-900 dark:bg-theme-gray dark:text-white">
    <div class="flex flex-col mb-2 md:hidden">
      <input type="text" :placeholder="t('recipes.search')" v-model="searchText"
        class="mx-4 p-2 my-2 rounded text-black" />
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 m-4 gap-5">
      <div v-for="item in items" @click="goToRecipe(item.id || 0)" @keydown.enter="goToRecipe(item.id || 0)"
        tabindex="0" class="
          p-5
          h-60
          rounded-lg
          shadow
          bg-white
          dark:bg-theme-secondary-gray
          overflow-hidden
        ">
        <div style="height: calc(100% - 0.5rem)" class="-mx-5 -mt-5 overflow-hidden">
          <img alt="Recipe image" v-if="item.imageAvailable" :src="item.image" class="object-contain" />
          <div v-else class="bg-theme-primary h-full grid place-items-center">
            <svg class="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        </div>
        <div class="h-full pt-2">
          <div class="truncate inline-block" style="width: calc(100% - 35px)">
            <span class="text-ellipsis text-black dark:text-white text-lg">{{
            item.title
            }}</span>
          </div>
          <div class="truncate inline-block" syle="width: 30px">
            <span class="text-black dark:text-white">{{ item.score }}⭐</span>
          </div>
        </div>
      </div>
    </div>
    <!-- <button
      @click="goToNew()"
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
    </button> -->
    <Menu as="div" class="p-0 w-14 h-14 fixed bottom-6 right-6">
      <div>
        <MenuButton class="
            p-0
            w-14
            h-14
            fixed
            bottom-6
            right-6
            bg-theme-primary
            rounded-full
            hover:bg-theme-secondary
            focus:ring-4 focus:ring-theme-primary focus:outline-none
            shadow-lg
          ">
          <svg viewBox="0 0 20 20" enable-background="new 0 0 20 20" class="w-6 h-6 inline-block">
            <path fill="#FFFFFF" d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                C15.952,9,16,9.447,16,10z" />
          </svg>
        </MenuButton>
      </div>

      <transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
        <MenuItems class="
            -top-2
            transform
            -translate-y-full
            absolute
            right-0
            w-56
            origin-top-right
            bg-white
            divide-y divide-gray-100
            rounded-md
            shadow-lg
            ring-1 ring-black ring-opacity-5
            focus:outline-none
          ">
          <div class="px-1 py-1">
            <MenuItem :key="child.name" v-for="child in addOptions" v-slot="{ active }">
            <button @click="child.action" :class="[
              active ? 'bg-theme-secondary text-white' : 'text-gray-900',
              'group flex w-full items-center rounded-md px-2 py-2 text-sm',
            ]">
              {{ child.text }}
            </button>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>
