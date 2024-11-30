<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useState } from "../../../services/store";
import { getCategoryById } from "../../../services/dataService";
import { Category } from "../../../services/category";
import RecipeList from "../../../components/RecipeList.vue";

const route = useRoute();

const state = useState()!;
const id = computed(() => parseInt(route.params.id as string));
const category = ref({} as Category);
const isLoaded = ref(false);

onMounted(async () => {

  if (id.value == 0) {
    category.value = { id: 0, name: "All", image: undefined };
  } else {
    category.value = await getCategoryById(id.value);
  }
  isLoaded.value = true;

  state.title = category.value.name;
  state.menuOptions = [];
});

</script>

<template>
  <recipe-list v-if="isLoaded" :category-id="category.id" />
</template>
