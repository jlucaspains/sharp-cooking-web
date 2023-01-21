<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRecipe,
  saveRecipe,
  saveRecipeImage,
  deleteRecipeImage,
  getRecipeImages,
  getNextRecipeId,
} from "../../../services/dataService";
import { RecipeImage } from "../../../services/recipe";
import { RecipeViewModel } from "../recipeViewModel";
import { useState } from "../../../services/store";
import { notify } from "notiwind";
import RatingPicker from "../../../components/RatingPicker.vue";
import { fileOpen } from "browser-fs-access";
import Modal from "../../../components/Modal.vue";
import { useTranslation } from "i18next-vue";
import BusyIndicator from "../../../components/BusyIndicator.vue";
import ImageGallery from "../../../components/ImageGallery.vue";

const state = useState()!;
const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const id = computed(() => parseInt(route.params.id as string));
const query = computed(() => route.query);
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  imageAvailable: false,
} as RecipeViewModel);
const images = ref([] as Array<RecipeImage>);
const isDirtyModalOpen = ref(false);
const isImportModalOpen = ref(false);
const importRecipeUrl = ref("");
const isImporting = ref(false);
const stepRefs = ref<HTMLInputElement[]>([]);
const ingredientRefs = ref<HTMLInputElement[]>([]);
const selectedImage = ref<number>(0);
let isDirty = false;
const deletedImages: Array<RecipeImage> = [];

watch(
  item,
  (newValue: RecipeViewModel) => {
    isDirty = true;
  },
  { deep: true }
);

onMounted(async () => {
  state.menuOptions = [
    {
      text: t("general.save"),
      action: save,
      svg: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />  <polyline points="17 21 17 13 7 13 7 21" />  <polyline points="7 3 7 8 15 8" />`,
    },
  ];

  if (query.value.import == "1") {
    isImportModalOpen.value = true;
  }

  let recipe: RecipeViewModel;
  if (id.value === 0) {
    recipe = new RecipeViewModel();
    recipe.title = "";
    recipe.steps.push("");
    recipe.ingredients.push("");
    recipe.score = 3;
  } else {
    recipe = (await getRecipe(id.value)) as RecipeViewModel;
  }

  if (recipe) {
    state.title = recipe.title || t("pages.recipe.id.edit.newRecipe");

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      allImages.forEach((item) => {
        images.value.push(item);
      });
      recipe.imageAvailable = images.value.length > 0;
    }

    item.value = recipe;

    await nextTick();

    isDirty = false;
  }
});

router.beforeEach(async (to, from) => {
  if (isDirty) {
    isDirtyModalOpen.value = true;
    return false;
  }

  return true;
});

async function isDirtyModalClose(shouldLeave: boolean) {
  isDirtyModalOpen.value = false;

  if (shouldLeave) {
    isDirty = false;
    router.back();
  }
}

async function save() {
  const isNew = !item.value.id;
  if (isNew) {
    item.value.id = await getNextRecipeId();

    for (const image of images.value) {
      image.recipeId = item.value.id;
    }
  }

  // remove proxy stuff
  const recipe = JSON.parse(JSON.stringify(item.value));
  await saveRecipe(recipe);

  for (const image of images.value) {
    const recipeImage = JSON.parse(JSON.stringify(image));
    await saveRecipeImage(recipeImage);
  }

  for (const image of deletedImages) {
    if (image.id) {
      await deleteRecipeImage(image.id);
    }
  }

  if (isNew) {
    router.replace(`/recipe/${item.value.id}/edit`);
  }

  isDirty = false;

  state.title = recipe.title;

  notify(
    {
      group: "success",
      title: t("general.success"),
      text: t("pages.recipe.id.edit.savedSuccessfully"),
    },
    2000
  );
}

async function pickImage() {
  const imagePicked = await fileOpen({
    mimeTypes: ["image/*"],
  });

  const newImage = await getBase64(imagePicked);
  images.value.push(new RecipeImage(id.value, null, newImage));
  item.value.imageAvailable = images.value.length > 0;
}

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function addIngredientAt(index: number) {
  item.value.ingredients.splice(index + 1, 0, "");
  nextTick(() => {
    ingredientRefs.value[index + 1].focus();
  });
}

function addStepAt(index: number) {
  item.value.steps.splice(index + 1, 0, "");
  nextTick(() => {
    stepRefs.value[index + 1].focus();
  });
}

async function importRecipe() {
  let success = true;
  try {
    isImportModalOpen.value = false;
    isImporting.value = true;
    const result = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: `{"url": "${importRecipeUrl.value}", "downloadImage": true}`
    });


    success = result.ok;
    if (!result.ok) {
      return;
    }

    const html = await result.json();
    item.value.title = html.title;
    item.value.score = 5;
    item.value.ingredients = html.ingredients.map((x: any) => x.raw);
    item.value.steps = html.steps.map((x: any) => x.raw);

    if (html.image) {
      images.value.push(new RecipeImage(id.value, null, html.image));
    }

    item.value.imageAvailable = images.value.length > 0;
  }
  catch {
    isImportModalOpen.value = true;
    success = false;
  }
  finally {
    isImporting.value = false;

    notify(
      {
        group: success ? "success" : "error",
        title: success ? t("general.done") : t("general.error"),
        text: success ? t("pages.recipe.id.edit.importedSuccessfully") : t("pages.recipe.id.edit.couldNotImport"),
      },
      2000
    );
  }
}

async function fillUrlFromClipboard() {
  if (navigator.clipboard) {
    navigator.clipboard
      .readText()
      .then((clipText) => {
        if (clipText.startsWith("https://") || clipText.startsWith("http://")) {
          importRecipeUrl.value = clipText
        }
      })
      .catch((error) => {
        notify(
          {
            group: "error",
            title: t("general.error"),
            text: t("pages.recipe.id.edit.importFromClipboardFailed"),
          },
          2000
        );
      });
  } else {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.edit.importFromClipboardNotAccessible"),
      },
      2000
    );
  }
}

function removeImage() {
  deletedImages.push(images.value[selectedImage.value]);
  images.value.splice(selectedImage.value, 1);
}
</script>

<template>
  <div>
    <div>
      <ImageGallery v-if="item.imageAvailable" @selection-changed="(value) => selectedImage = value" :images="images" />
      <div class="
          bg-theme-primary
          rounded-lg
          grid
          place-items-center
          w-full
          h-80
          overflow-hidden
        " v-else>
        <svg class="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>
    <div class="h-14">
      <div class="no-print float-right">
        <button class="
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
        " data-testid="add-image-button" @click="pickImage">
          <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor"
              d="M13 19C13 19.7 13.13 20.37 13.35 21H5C3.9 21 3 20.11 3 19V5C3 3.9 3.9 3 5 3H19C20.11 3 21 3.9 21 5V13.35C20.37 13.13 19.7 13 19 13V5H5V19H13M13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H13.35C13.75 15.88 14.47 14.91 15.4 14.21L13.96 12.29M20 18V15H18V18H15V20H18V23H20V20H23V18H20Z" />
          </svg>
        </button>
        <button class="
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
        " data-testid="remove-image-button" @click="removeImage">
          <svg class="h-5 w-5 text-white m-auto" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M13 19C13 19.7 13.13 20.37 13.35 21H5C3.9 21 3 20.11 3 19V5C3 3.9 3.9 3 5 3H19C20.11 3 21 3.9 21 5V13.35C20.37 13.13 19.7 13 19 13V5H5V19H13M11.21 15.83L9.25 13.47L6.5 17H13.35C13.75 15.88 14.47 14.91 15.4 14.21L13.96 12.29L11.21 15.83M22.54 16.88L21.12 15.47L19 17.59L16.88 15.47L15.47 16.88L17.59 19L15.47 21.12L16.88 22.54L19 20.41L21.12 22.54L22.54 21.12L20.41 19L22.54 16.88Z" />
          </svg>
        </button>
      </div>
    </div>
    <div>
      <label for="title">{{ t("pages.recipe.id.edit.title") }}</label>
      <input id="title" type="text" v-model="item.title" class="block p-2 w-full rounded text-black shadow-sm" />
      <label>{{ t("pages.recipe.id.edit.rating") }}</label>
      <RatingPicker class="mb-2" v-model="item.score" />
      <label>{{ t("pages.recipe.id.edit.ingredients") }}</label>
      <button class="ml-2 align-middle" type="button" :title="t('pages.recipe.id.edit.addIngredient')"
        @click="addIngredientAt(item.ingredients.length - 1)">
        <svg class="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <div class="flex my-3 w-full" v-for="(ingredient, index) in item.ingredients">
        <input type="text" :placeholder="t('pages.recipe.id.edit.ingredientPlaceholder')"
          v-model="item.ingredients[index]" @keyup.enter="addIngredientAt(index)" ref="ingredientRefs"
          class="block p-2 rounded flex-auto text-black shadow-sm" />
        <button type="button" class="ml-2 align-middle" title="Delete Ingredient"
          @click="item.ingredients.splice(index, 1)">
          <svg class="h-4 w-4 text-black dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
            stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
          </svg>
        </button>
      </div>
      <label>{{ t("pages.recipe.id.edit.steps") }}</label>
      <button class="ml-2" type="button" title="Add Step" @click="addStepAt(item.steps.length - 1)">
        <svg class="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <div class="flex my-3 w-full" v-for="(step, index) in item.steps">
        <input type="text" :placeholder="t('pages.recipe.id.edit.stepPlaceholder')" v-model="item.steps[index]"
          class="block p-2 flex-auto rounded text-black shadow-sm" ref="stepRefs" @keyup.enter="addStepAt(index)" />
        <button type="button" class="ml-2" title="Delete Step" @click="item.steps.splice(index, 1)">
          <svg class="h-4 w-4 text-black dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
            stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
            <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
          </svg>
        </button>
      </div>
      <label for="notes">{{ t("pages.recipe.id.edit.notes") }}</label>
      <textarea id="notes" v-model="item.notes" class="
        block
        p-2
        flex-auto
        w-full
        h-20
        bg-white
        rounded
        text-base text-black
      " />
    </div>
    <Modal :isOpen="isDirtyModalOpen" @closed="isDirtyModalOpen = false" :title="t('pages.recipe.id.edit.dirtyTitle')"
      :buttons="[
        {
          title: t('pages.recipe.id.edit.dirtyStay'),
          action: () => isDirtyModalClose(false),
        },
        {
          title: t('pages.recipe.id.edit.dirtyLeave'),
          danger: true,
          action: () => isDirtyModalClose(true),
        },
      ]">
      <span class="dark:text-white">{{ t('pages.recipe.id.edit.dirtyContent') }}</span>
    </Modal>
    <Modal :isOpen="isImportModalOpen" @closed="isImportModalOpen = false"
      :title="t('pages.recipe.id.edit.importTitle')" :buttons="[
        {
          title: t('pages.recipe.id.edit.importFromClipboard'),
          action: async () => {
            await fillUrlFromClipboard();
          }
        },
        {
          title: t('general.cancel'),
          action: () => isImportModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: importRecipe,
        },
      ]">
      <input v-model="importRecipeUrl" data-testid="import-url" class="block my-2 p-2 w-full rounded text-black" />
    </Modal>
    <BusyIndicator :busy="isImporting" :message1="t('pages.recipe.id.edit.importContent1')"
      :message2="t('pages.recipe.id.edit.importContent2')" />
  </div>
</template>
