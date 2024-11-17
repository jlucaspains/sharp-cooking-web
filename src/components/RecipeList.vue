<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../services/store";
import { getRecipesByCategory, getRecipeMedia, initialize, saveSetting, getSetting, getRecipes } from "../services/dataService";
import { RecipeViewModel } from "../pages/recipe/recipeViewModel";
import debounce from "lodash.debounce";
import { TransitionRoot, Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import RecipeCard from "./RecipeCard.vue";

const props = defineProps<{
  categoryId?: number;
}>();


watch(
  () => props.categoryId,
  (newValue: number | undefined) => {
    loadCategory();
  }
);


const router = useRouter();
const { t } = useTranslation();
const state = useState()!;

const items = ref([] as RecipeViewModel[]);
const searchText = ref("");
const searchInput = ref(null as HTMLInputElement | null);
const displaySearch = ref(false);
let allRecipes = [] as RecipeViewModel[];
let debouncedWatch: (currentValue: string, oldValue: string) => void;
let debouncedScroll: (currentValue: number) => void;
const addOptions = ref([] as Array<{ name: string, text: string, action: () => void }>);

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
  return items.sort((a, b) => {
    if (a.changedOn < b.changedOn) {
      return -1;
    }
    if (a.changedOn > b.changedOn) {
      return 1;
    }

    return 0;
  });
}
async function sort(type: string, items: Array<RecipeViewModel>, saveSort: boolean = true) {
  if (saveSort) {
    await saveSortOption(type);
  }

  switch (type) {
    case "title":
      return sortByTitle(items);
    case "rating":
      return sortByRating(items);
    case "date":
      return sortByDate(items);
    default:
      return items;
  }
}

onMounted(async () => {
  await initialize(t("initialRecipes", { returnObjects: true }) as any);
  addOptions.value = [{
    name: "AddManual",
    text: t("pages.index.addManually"),
    action: goToNew,
  },
  {
    name: "ImportFromWebsite",
    text: t("pages.index.importFromWebsite"),
    action: goToImportFromUrl,
  },
  {
    name: "ImportFromBackup",
    text: t("pages.index.importFromBackup"),
    action: goToImportFromBackup,
  },
  {
    name: "ImportFromScan",
    text: t("pages.index.importFromScan"),
    action: goToImportFromScan,
  },
  {
    name: "ImportFromCloud",
    text: t("pages.index.importFromCloud"),
    action: goToImportFromCloud,
  }];

  // state.title = t("pages.index.title");
  state.menuOptions = [
    {
      svg: `<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />`,
      action: activateSearch,
    },
    {
      svg: `<circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" />`,
      children: [
        {
          text: t("pages.index.sortByTitle"),
          action: async () => {
            items.value = await sort("title", items.value);
          },
        },
        {
          text: t("pages.index.sortByRating"),
          action: async () => {
            items.value = await sort("rating", items.value);
          },
        },
        {
          text: t("pages.index.sortByRecipeDate"),
          action: async () => {
            items.value = await sort("date", items.value);
          },
        },
        {
          text: t("pages.index.options"),
          action: goToOptions,
        },
      ],
    },
  ];

  debouncedWatch = debounce((currentValue: string, oldValue: string) => {
    items.value = allRecipes.filter((item) => filterPredicate(currentValue, item));
  }, 200);

  debouncedScroll = debounce((currentValue: number) => {
    state.indexScrollY = currentValue;
  }, 200);

  loadCategory();
});

async function loadCategory() {
  if (props.categoryId){
    allRecipes = (await getRecipesByCategory(props.categoryId)) as RecipeViewModel[];
  } else {
    allRecipes = (await getRecipes()) as RecipeViewModel[];
  }

  for (const recipe of allRecipes) {
    const item = await getRecipeMedia(recipe.id || 0);
    recipe.image = (item && item.url) || undefined;
    recipe.imageAvailable = recipe.image ? true : false;
  }

  const sortType = await getSetting("AllRecipesSort", "");

  items.value = await sort(sortType, allRecipes, false);

  window.addEventListener("scroll", onScrol)

  if (state.indexScrollY > 0) {
    window.scrollTo(0, state.indexScrollY);
  }
};

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScrol);
});

watch(searchText, (currentValue, oldValue) => {
  debouncedWatch(currentValue, oldValue);
});

function onScrol() {
  debouncedScroll(window.scrollY);
}

function goToRecipe(id: number) {
  router.push(`/recipe/${id}`);
}

function goToNew() {
  router.push("/recipe/0/edit");
}

function goToImportFromUrl() {
  router.push("/recipe/0/edit?importFromUrl=1");
}

function goToImportFromBackup() {
  router.push("/recipe/import-backup");
}

function goToImportFromScan() {
  router.push("/recipe/import-ocr");
}

function goToOptions() {
  router.push("/options");
}

async function saveSortOption(type: string) {
  await saveSetting("AllRecipesSort", type);
}

function goToImportFromCloud() {
  router.push("/recipe/0/edit?importFromShare=1");
}

function activateSearch() {
  displaySearch.value = !displaySearch.value;

  nextTick(() => {
    searchInput.value?.focus();
    window.scrollTo(0, 0);
  });
}

function setSearchType(type: string) {
  searchText.value = `${type} `;
  searchInput.value?.focus();
}
function filterPredicate(searchValue: string, item: RecipeViewModel): boolean {
  const filterByIngredients = t("pages.index.filterByIngredients");
  if (searchValue.startsWith(filterByIngredients)) {
    return item.ingredients.some(ing => simpleSearchInText(ing, getSearchValue(searchText.value, filterByIngredients)));
  }

  const filterBySteps = t("pages.index.filterBySteps");
  if (searchValue.startsWith(filterBySteps)) {
    return item.steps.some(stp => simpleSearchInText(stp, getSearchValue(searchText.value, filterBySteps)));
  }

  const filterByTitle = t("pages.index.filterByTitle");
  if (searchValue.startsWith(filterByTitle)) {
    return simpleSearchInText(item.title, getSearchValue(searchText.value, filterByTitle));
  }

  return simpleSearchInText(item.title, getSearchValue(searchText.value, ""));
}

function getSearchValue(fullValue: string, prefix: string) {
  return fullValue.replace(prefix, "").trim().toLowerCase();
}

function simpleSearchInText(a: string, b: string) {
  return a.toLowerCase().includes(b.toLowerCase());
}
</script>

<template>
  <div class="bg-white text-slate-900 dark:bg-theme-gray dark:text-white">
    <TransitionRoot :show="displaySearch" enter="transition-all duration-500" enter-from="opacity-0 scale-90"
      enter-to="opacity-100 scale-100" leave="transition-all duration-200" leave-from="opacity-100 scale-100"
      leave-to="opacity-0 scale-90">
      <div class="flex flex-col mb-2">
        <input ref="searchInput" type="search" data-testid="search-input" :placeholder="t('pages.index.search')"
          v-model="searchText" class="p-2 my-2 rounded text-black" />
        <div class="flex">
          <button type="button" data-testid="search-by-title"
            class="bg-theme-primary hover:bg-theme-secondary text-white font-bold p-2 my-2 rounded"
            @click="setSearchType(t('pages.index.filterByTitle'))">{{ t("pages.index.filterByTitle") }}</button>
          <button type="button" data-testid="search-by-ingredients"
            class="bg-theme-primary hover:bg-theme-secondary text-white font-bold p-2 my-2 ml-2 rounded"
            @click="setSearchType(t('pages.index.filterByIngredients'))">{{ t("pages.index.filterByIngredients")
            }}</button>
          <button type="button" data-testid="search-by-steps"
            class="bg-theme-primary hover:bg-theme-secondary text-white font-bold p-2 my-2 ml-2 rounded"
            @click="setSearchType(t('pages.index.filterBySteps'))">{{ t("pages.index.filterBySteps") }}</button>
        </div>
      </div>
    </TransitionRoot>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 my-4 gap-5">
      <recipe-card v-for="item in items" :key="item.id" :title="item.title" :image="item.image"
        :imageAvailable="item.imageAvailable" :rating="item.score" @click="goToRecipe(item.id || 0)" />
    </div>
    <Menu as="div" class="p-0 w-14 h-14 fixed bottom-6 right-6">
      <div>
        <MenuButton data-testid="add-menu-button" class="
          w-12
          h-12
          m-1
          rounded-full
          bg-theme-primary
          hover:bg-theme-secondary
          focus:bg-theme-secondary
          focus:shadow-lg
          shadow-md
          hover:shadow-lg
          transition duration-150 ease-in-out
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
