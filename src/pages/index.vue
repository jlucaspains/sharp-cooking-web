<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTranslation } from "i18next-vue";
import { useState } from "../services/store";
import { useRouter } from "vue-router";
import { initialize, getSetting } from "../services/dataService";
import RecipeList from "../components/RecipeList.vue";
import CategoryList from "../components/CategoryList.vue";

const router = useRouter();
const { t } = useTranslation();
const state = useState()!;

const categoriesEnabled = ref(false);
const isLoaded = ref(false);

onMounted(async () => {
  await initialize(t("initialRecipes", { returnObjects: true }) as any);

  const enableCategories = await getSetting("EnableCategoryDisplay", "false");
  categoriesEnabled.value = enableCategories === "true";

  isLoaded.value = true;
  
  state.title = "Home";
  state.menuOptions = [
    {
      svg: `<circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" />`,
      children: [
        {
          text: t("pages.index.options"),
          action: goToOptions,
        },
      ],
    },
  ];
});

function goToOptions() {
  router.push("/options");
}
</script>

<template>
  <div class="bg-white text-slate-900 dark:bg-theme-gray dark:text-white">
    <div v-if="categoriesEnabled && isLoaded">
      <category-list />
    </div>
    <div v-if="!categoriesEnabled && isLoaded">
      <recipe-list />
    </div>
  </div>
</template>
