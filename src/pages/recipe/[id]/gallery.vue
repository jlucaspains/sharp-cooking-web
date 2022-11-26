<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import {
  getRecipe,
  getRecipeImages,
} from "../../../services/dataService";
import { RecipeImage } from "../../../services/recipe";
import { useState } from "../../../services/store";
import { Swiper, SwiperSlide } from 'swiper/vue';
import { useTranslation } from "i18next-vue";

const state = useState()!;
const route = useRoute();
const { t } = useTranslation();

const id = computed(() => parseInt(route.params.id as string));
const images = ref([] as RecipeImage[]);

onMounted(async () => {
  state.menuOptions = [];
  state.fullScreen = true;
  state.hideTopBar = false;

  const recipe = await getRecipe(id.value);

  if (recipe) {
    state.title = recipe.title;

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      images.value = allImages;
    }
  }
});

onBeforeRouteLeave((to, from) => {
  state.fullScreen = false;
});

function toggleHideTopBar() {
  state.hideTopBar = !state.hideTopBar;
}
</script>

<template>
  <swiper :slides-per-view="1" class="w-screen h-screen">
    <swiper-slide @click="toggleHideTopBar()" :zoom="true" v-for="image in images">
      <img :alt="t('pages.recipe.id.gallery.recipeImage')" :src="image.image"
        class="object-contain w-screen h-screen" />
    </swiper-slide>
  </swiper>
</template>

<style>
@import 'swiper/scss';

.swiper,
.swiper div {
  z-index: auto !important;
}
</style>