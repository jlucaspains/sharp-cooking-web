<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useState } from "../services/store";
import { getRecipes } from "../services/dataService";
import { Recipe } from "../services/recipe";

const router = useRouter();
const { t } = useI18n();
const state = useState()!;

const items = ref([] as Recipe[]);

onMounted(async () => {
  state.title = "All Recipes";

  const allRecipes = await getRecipes();

  items.value = allRecipes;
});

function goToRecipe(id: number) {
  router.push(`/recipe/${id}`);
}

function gotToNew() {
  router.push("/recipe/new");
}
</script>

<template>
  <div class="mt-16 bg-white text-slate-900 dark:bg-theme-gray dark:text-white">
    <div class="flex flex-col mb-2 md:hidden">
      <input
        type="text"
        :placeholder="t('recipes.search')"
        class="mx-4 p-2 my-2 rounded text-black"
      />
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 m-4 gap-5">
      <div
        @click="goToRecipe(item.id || 0)"
        @keydown.enter="goToRecipe(item.id || 0)"
        tabindex="0"
        v-for="item in items"
        class="p-5 rounded-lg shadow shadow-slate-50 bg-white dark:bg-theme-secondary-gray"
      >
        <img src="../assets/logo.png" class="mx-auto" />
        <div>
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
      class="p-0 w-14 h-14 fixed bottom-6 right-6 bg-theme-primary rounded-full hover:bg-theme-secondary focus:ring-4 focus:ring-theme-primary focus:outline-none"
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
