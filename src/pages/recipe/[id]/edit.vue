<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useTranslation } from "i18next-vue";
import { useState } from "../../../services/store";
import { getRecipe, saveRecipe, deleteRecipe, getRecipeMediaList, saveRecipeMedia, deleteRecipeMedia, getFolders } from "../../../services/dataService";
import { Recipe, RecipeMedia } from "../../../services/recipe";
import { useQuasar } from "quasar";
import { useForm, useFieldArray } from "vee-validate";
import * as yup from "yup";
import { fileOpen } from "browser-fs-access";

const state = useState()!;
const router = useRouter();
const route = useRoute();
const { t } = useTranslation();
const $q = useQuasar();
const recipe = ref<Recipe | null>(null);
const media = ref<RecipeMedia[]>([]);
const folderOptions = ref<{ id: number, name: string }[]>([]);
const selectedFolder = ref<number | null>(null);

const { handleSubmit, resetForm, setFieldValue, values, errors } = useForm({
  initialValues: {
    title: "",
    score: 0,
    ingredients: [""],
    steps: [""],
    notes: "",
    source: "",
    folderId: null,
  },
  validationSchema: yup.object({
    title: yup.string().required(t("validation.required")),
    score: yup.number().min(0).max(5).required(t("validation.required")),
    ingredients: yup.array().of(yup.string().required(t("validation.required"))),
    steps: yup.array().of(yup.string().required(t("validation.required"))),
    notes: yup.string(),
    source: yup.string(),
    folderId: yup.number().nullable(),
  }),
});

const { fields: ingredientFields, push: addIngredient, remove: removeIngredient } = useFieldArray({
  name: "ingredients",
});

const { fields: stepFields, push: addStep, remove: removeStep } = useFieldArray({
  name: "steps",
});

onMounted(async () => {
  const id = Number(route.params.id);
  if (id) {
    recipe.value = await getRecipe(id);
    if (recipe.value) {
      resetForm({
        values: {
          title: recipe.value.title,
          score: recipe.value.score,
          ingredients: recipe.value.ingredients,
          steps: recipe.value.steps,
          notes: recipe.value.notes,
          source: recipe.value.source,
          folderId: recipe.value.folderId || null,
        },
      });
      selectedFolder.value = recipe.value.folderId || null;
    }
    media.value = await getRecipeMediaList(id);
  }

  folderOptions.value = await getFolders();
});

const onSubmit = handleSubmit(async (values) => {
  if (recipe.value) {
    recipe.value.title = values.title;
    recipe.value.score = values.score;
    recipe.value.ingredients = values.ingredients;
    recipe.value.steps = values.steps;
    recipe.value.notes = values.notes;
    recipe.value.source = values.source;
    recipe.value.folderId = values.folderId;

    await saveRecipe(recipe.value);
    $q.notify({ type: "positive", message: t("messages.saved") });
    router.push(`/recipe/${recipe.value.id}`);
  }
});

const onDelete = async () => {
  if (recipe.value) {
    await deleteRecipe(recipe.value.id!);
    $q.notify({ type: "positive", message: t("messages.deleted") });
    router.push("/");
  }
};

const onAddMedia = async () => {
  const blob = await fileOpen({
    mimeTypes: ["image/*"],
  });
  const url = URL.createObjectURL(blob);
  const newMedia = new RecipeMedia(recipe.value!.id!, "img", url);
  await saveRecipeMedia(newMedia);
  media.value.push(newMedia);
};

const onDeleteMedia = async (id: number) => {
  await deleteRecipeMedia(id);
  media.value = media.value.filter((item) => item.id !== id);
};
</script>

<template>
  <div class="container mx-auto p-4">
    <form @submit="onSubmit">
      <div class="mb-4">
        <label for="title" class="block text-gray-700">{{ t("fields.title") }}</label>
        <input v-model="values.title" id="title" type="text" class="mt-1 block w-full" />
        <span class="text-red-500">{{ errors.title }}</span>
      </div>

      <div class="mb-4">
        <label for="score" class="block text-gray-700">{{ t("fields.score") }}</label>
        <input v-model="values.score" id="score" type="number" min="0" max="5" class="mt-1 block w-full" />
        <span class="text-red-500">{{ errors.score }}</span>
      </div>

      <div class="mb-4">
        <label for="folder" class="block text-gray-700">{{ t("fields.folder") }}</label>
        <select v-model="values.folderId" id="folder" class="mt-1 block w-full">
          <option :value="null">{{ t("fields.noFolder") }}</option>
          <option v-for="folder in folderOptions" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
        </select>
        <span class="text-red-500">{{ errors.folderId }}</span>
      </div>

      <div class="mb-4">
        <label for="ingredients" class="block text-gray-700">{{ t("fields.ingredients") }}</label>
        <div v-for="(ingredient, index) in ingredientFields" :key="index" class="flex mb-2">
          <input v-model="ingredient.value" type="text" class="mt-1 block w-full" />
          <button type="button" @click="removeIngredient(index)" class="ml-2 text-red-500">x</button>
        </div>
        <button type="button" @click="addIngredient('')" class="mt-2 text-blue-500">{{ t("actions.addIngredient") }}</button>
        <span class="text-red-500">{{ errors.ingredients }}</span>
      </div>

      <div class="mb-4">
        <label for="steps" class="block text-gray-700">{{ t("fields.steps") }}</label>
        <div v-for="(step, index) in stepFields" :key="index" class="flex mb-2">
          <input v-model="step.value" type="text" class="mt-1 block w-full" />
          <button type="button" @click="removeStep(index)" class="ml-2 text-red-500">x</button>
        </div>
        <button type="button" @click="addStep('')" class="mt-2 text-blue-500">{{ t("actions.addStep") }}</button>
        <span class="text-red-500">{{ errors.steps }}</span>
      </div>

      <div class="mb-4">
        <label for="notes" class="block text-gray-700">{{ t("fields.notes") }}</label>
        <textarea v-model="values.notes" id="notes" class="mt-1 block w-full"></textarea>
        <span class="text-red-500">{{ errors.notes }}</span>
      </div>

      <div class="mb-4">
        <label for="source" class="block text-gray-700">{{ t("fields.source") }}</label>
        <input v-model="values.source" id="source" type="text" class="mt-1 block w-full" />
        <span class="text-red-500">{{ errors.source }}</span>
      </div>

      <div class="mb-4">
        <label class="block text-gray-700">{{ t("fields.media") }}</label>
        <div v-for="item in media" :key="item.id" class="flex items-center mb-2">
          <img :src="item.url" class="w-16 h-16 object-cover mr-2" />
          <button type="button" @click="onDeleteMedia(item.id!)" class="text-red-500">x</button>
        </div>
        <button type="button" @click="onAddMedia" class="mt-2 text-blue-500">{{ t("actions.addMedia") }}</button>
      </div>

      <div class="flex justify-between">
        <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">{{ t("actions.save") }}</button>
        <button type="button" @click="onDelete" class="bg-red-500 text-white px-4 py-2 rounded">{{ t("actions.delete") }}</button>
      </div>
    </form>
  </div>
</template>
