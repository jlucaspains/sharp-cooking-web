<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import {
  getRecipe,
  getRecipeImages,
} from "../../../services/dataService";
import { RecipeImage } from "../../../services/recipe";
import { useState } from "../../../services/store";
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import { useI18n } from "vue-i18n";

const state = useState()!;
const route = useRoute();
const { t } = useI18n();

const id = computed(() => parseInt(route.params.id as string));
const images = ref([] as RecipeImage[]);

onMounted(async () => {
  state.menuOptions = [];

  const recipe = await getRecipe(id.value as number);

  if (recipe) {
    state.title = recipe.title;

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      images.value = allImages;
    }
  }
});
</script>

<template>
  <swiper
    :slides-per-view="1"
    :space-between="50"
    class="w-full h-80 dark:text-white"
  >
    <swiper-slide v-for="image in images">
      <img
        :alt="t('pages.recipe.id.gallery.recipeImage')"
        :src="image.image"
        class="w-full rounded-lg h-80"
      />
    </swiper-slide>
  </swiper>
</template>