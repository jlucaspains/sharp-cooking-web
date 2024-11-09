<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useState } from "../../../services/store";
import { getRecipe, saveRecipe, deleteRecipe, getSetting } from "../../../services/dataService";
import { Recipe } from "../../../services/recipe";
import { notify } from "notiwind";
import { useTranslation } from "i18next-vue";
import { RecipeViewModel } from "../recipeViewModel";
import Modal from "../../../components/Modal.vue";
import { fetchWithRetry } from "../../../services/fetchWithRetry";
import i18next from "i18next";

const { t } = useTranslation();
const state = useState()!;
const router = useRouter();
const route = useRoute();
const id = parseInt(route.params.id as string);
const recipe = ref(new RecipeViewModel());
const isDeleteModalOpen = ref(false);
const isBusy = ref(false);
const editInSingleTextArea = ref(false);
const ingredientsText = ref("");
const stepsText = ref("");

onMounted(async () => {
  state.title = t("pages.recipe.id.edit.title");
  state.menuOptions = [];

  const recipeResult = await getRecipe(id);
  if (!recipeResult) {
    router.push("/");
    return;
  }

  recipe.value = Object.assign(new RecipeViewModel(), recipeResult);
  recipe.value.image = await getRecipeMedia(id);
  recipe.value.imageAvailable = !!recipe.value.image;
  recipe.value.hasNotes = !!recipe.value.notes;

  editInSingleTextArea.value = (await getSetting("EditInSingleTextArea", "false")) === "true";

  if (editInSingleTextArea.value) {
    ingredientsText.value = recipe.value.ingredients.join("\n");
    stepsText.value = recipe.value.steps.join("\n");
  }

  state.menuOptions = [
    {
      text: t("general.save"),
      action: save,
      svg: `<path stroke="none" d="M0 0h24v24H0z"/>  <path d="M12 20l9 -5l-9 -5l-9 5l9 5" />  <path d="M12 4l9 -5l-9 -5l-9 5l9 5" />`,
    },
    {
      text: t("general.delete"),
      action: () => (isDeleteModalOpen.value = true),
      svg: `<path stroke="none" d="M0 0h24v24H0z"/>  <path d="M4 7h16" />  <path d="M10 11v6" />  <path d="M14 11v6" />  <path d="M5 7l1 -4h12l1 4" />  <path d="M6 7v14h12v-14" />`,
    },
  ];
});

async function save() {
  if (editInSingleTextArea.value) {
    recipe.value.ingredients = ingredientsText.value.split("\n");
    recipe.value.steps = stepsText.value.split("\n");
  }

  await saveRecipe(recipe.value);

  notify(
    {
      group: "success",
      title: t("general.done"),
      text: t("pages.recipe.id.edit.savedSuccessfully"),
    },
    2000
  );
}

async function deleteRecipe() {
  await deleteRecipe(id);

  notify(
    {
      group: "success",
      title: t("general.done"),
      text: t("pages.recipe.id.edit.deletedSuccessfully"),
    },
    2000
  );

  router.push("/");
}
</script>

<template>
  <div v-if="recipe">
    <div class="mb-4">
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-400">{{
        t("pages.recipe.id.edit.titleLabel")
      }}</label>
      <input
        v-model="recipe.title"
        type="text"
        name="title"
        id="title"
        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
      />
    </div>

    <div class="mb-4">
      <label for="ingredients" class="block text-sm font-medium text-gray-700 dark:text-gray-400">{{
        t("pages.recipe.id.edit.ingredientsLabel")
      }}</label>
      <textarea
        v-if="editInSingleTextArea"
        v-model="ingredientsText"
        name="ingredients"
        id="ingredients"
        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        rows="10"
      ></textarea>
      <div v-else>
        <div
          v-for="(ingredient, index) in recipe.ingredients"
          :key="index"
          class="mt-1 flex"
        >
          <input
            v-model="recipe.ingredients[index]"
            type="text"
            name="ingredient"
            class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>

    <div class="mb-4">
      <label for="steps" class="block text-sm font-medium text-gray-700 dark:text-gray-400">{{
        t("pages.recipe.id.edit.stepsLabel")
      }}</label>
      <textarea
        v-if="editInSingleTextArea"
        v-model="stepsText"
        name="steps"
        id="steps"
        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        rows="10"
      ></textarea>
      <div v-else>
        <div
          v-for="(step, index) in recipe.steps"
          :key="index"
          class="mt-1 flex"
        >
          <input
            v-model="recipe.steps[index]"
            type="text"
            name="step"
            class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>

    <div class="mb-4">
      <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-400">{{
        t("pages.recipe.id.edit.notesLabel")
      }}</label>
      <textarea
        v-model="recipe.notes"
        name="notes"
        id="notes"
        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
        rows="5"
      ></textarea>
    </div>

    <Modal
      :isOpen="isDeleteModalOpen"
      @closed="isDeleteModalOpen = false"
      :title="t('pages.recipe.id.edit.deleteConfirmation')"
      :buttons="[
        {
          title: t('general.cancel'),
          action: () => (isDeleteModalOpen.value = false),
        },
        {
          title: t('general.delete'),
          danger: true,
          action: deleteRecipe,
        },
      ]"
    >
      <p>{{ t("pages.recipe.id.edit.deleteConfirmationMessage") }}</p>
    </Modal>
  </div>
</template>
