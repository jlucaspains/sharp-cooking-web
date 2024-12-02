<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../services/store";
import RecipeCard from "./RecipeCard.vue";
import { Category } from "../services/category";
import { getCategories } from "../services/dataService";

const router = useRouter();
const { t } = useTranslation();
const state = useState()!;
const categories = ref([] as Array<Category>);

onMounted(async () => {
  categories.value = await getCategories();
});

function goToCategory(id: number) {
  router.push(`/category/${id}`);
}
</script>

<template>
  <div class="bg-white text-slate-900 dark:bg-theme-gray dark:text-white">
    <div class="grid md:grid-cols-2 lg:grid-cols-3 my-4 gap-5">
      <recipe-card v-for="category in categories" :title="category.name" :image="category.image"
        :imageAvailable="category.image != undefined" :recipeCount="category.recipeCount"
        @click="goToCategory(category.id)" :rating="0" />
    </div>
  </div>
</template>
