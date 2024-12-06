<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRecipe,
  saveRecipe,
  saveRecipeMedia,
  deleteRecipeMedia,
  getRecipeMediaList,
  getNextRecipeId,
  getSetting,
  getAllCategories,
} from "../../../services/dataService";
import { RecipeMedia } from "../../../services/recipe";
import { RecipeViewModel } from "../recipeViewModel";
import { useState } from "../../../services/store";
import { notify } from "notiwind";
import RatingPicker from "../../../components/RatingPicker.vue";
import Modal from "../../../components/Modal.vue";
import { useTranslation } from "i18next-vue";
import BusyIndicator from "../../../components/BusyIndicator.vue";
import ImageGallery from "../../../components/ImageGallery.vue";
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { fetchWithRetry } from "../../../services/fetchWithRetry";
import { isVideoUrlSupported, prepareUrlForEmbed } from "../../../helpers/videoHelpers";
import RoundButton from "../../../components/RoundButton.vue";
import i18next from "i18next";
import { pickImage } from "../../../helpers/imageHelpers";
import { Category } from "../../../services/category";

const state = useState()!;
const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

let isDirty = false;
let croppingCanvas: HTMLCanvasElement;

const query = computed(() => route.query);
const id = computed(() => parseInt(route.params.id as string));
const categoryId = computed(() => parseInt(query.value.categoryId as string ?? "0"));
const item = ref({
  id: 0,
  title: "",
  score: 3,
  ingredients: [""] as string[],
  steps: [""] as string[],
  notes: "",
  imageAvailable: false,
  multiplier: 1,
  language: i18next.language,
  categoryId: categoryId.value,
  nutrition: {
    servingSize: 0,
    totalFat: 0,
    saturatedFat: 0,
    sodium: 0,
    protein: 0,
    cholesterol: 0,
    calories: 0,
    carbohydrates: 0,
    fiber: 0,
    sugar: 0,
    transFat: 0,
    unsaturatedFat: 0
  }
} as RecipeViewModel);
const images = ref([] as Array<RecipeMedia>);
const isDirtyModalOpen = ref(false);
const isImportFromUrlModalOpen = ref(false);
const isImportFromShareModalOpen = ref(false);
const isLanguageModalOpen = ref(false);
const importRecipeUrl = ref("");
const importRecipeCode = ref("");
const isImporting = ref(false);
const isProcessingImage = ref(false);
const stepRefs = ref<HTMLInputElement[]>([]);
const ingredientRefs = ref<HTMLInputElement[]>([]);
const selectedImage = ref<number>(-1);
const currentImage = ref("");
const currentMediaIsImage = ref(false);
const deletedImages: Array<RecipeMedia> = [];
const isCropping = ref(false);
const isAddVideoModalOpen = ref(false);
const addVideoUrl = ref("");
const addVideoUrlError = ref("");
const selectedLanguage = ref("");
const availableLanguages = ref(["pt-BR", "en-US"] as Array<string>);
const editInSingleTextArea = ref(false);
const ingredientsText = ref("");
const stepsText = ref("");
const categories = ref([] as Array<Category>);

let enableNutritionFacts = false;
let enableRecipeLanguageSwitcher = false;

watch(
  item,
  (newValue: RecipeViewModel) => {
    isDirty = true;
  },
  { deep: true }
);

watch(
  selectedImage,
  (newValue: number) => {
    currentImage.value = images.value[newValue].url;
    currentMediaIsImage.value = images.value[newValue].type == "img";
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

  const enableNutritionFactsSetting = await getSetting("EnableNutritionFacts", "false");
  enableNutritionFacts = enableNutritionFactsSetting == "true";

  const enableRecipeLanguageSwitcherSetting = await getSetting("EnableRecipeLanguageSwitcher", "false");
  enableRecipeLanguageSwitcher = enableRecipeLanguageSwitcherSetting == "true";

  editInSingleTextArea.value = (await getSetting("EditInSingleTextArea", "false")) === "true";

  if (query.value.importFromUrl == "1") {
    isImportFromUrlModalOpen.value = true;
  }

  if (query.value.importFromShare == "1") {
    isImportFromShareModalOpen.value = true;
  }

  if (query.value.shareCode) {
    importRecipeCode.value = query.value.shareCode as string;
  }

  categories.value = await getAllCategories();

  let recipe: RecipeViewModel | null = null;

  if (query.value.ocr == "1") {
    recipe = new RecipeViewModel();
    recipe.title = state.message.title;
    recipe.ingredients = state.message.ingredients.length == 0
      ? [""]
      : state.message.ingredients;
    recipe.steps = state.message.steps.length == 0
      ? [""]
      : state.message.steps;
    recipe.notes = state.message.notes;
    recipe.score = 3;
    recipe.language = i18next.language;
  } else if (id.value > 0) {
    recipe = (await getRecipe(id.value)) as RecipeViewModel;
  }

  if (recipe) {
    state.title = recipe.title || t("pages.recipe.id.edit.newRecipe");

    const allImages = await getRecipeMediaList(id.value);

    if (allImages.length > 0) {
      allImages.forEach((item) => {
        images.value.push(item);
      });
      recipe.imageAvailable = images.value.length > 0;
      selectedImage.value = 0;
    }
    item.value = recipe;

    await nextTick();

    isDirty = false;
  }

  if (editInSingleTextArea.value && recipe) {
    ingredientsText.value = recipe.ingredients.join("\n");
    stepsText.value = recipe.steps.join("\n");
  }

  selectedLanguage.value = item.value.language ?? i18next.language;
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

  if (editInSingleTextArea.value) {
    item.value.ingredients = ingredientsText.value.split("\n");
    item.value.steps = stepsText.value.split("\n");
  }

  // remove proxy stuff
  const recipe = JSON.parse(JSON.stringify(item.value));
  await saveRecipe(recipe);

  for (const image of images.value) {
    const recipeImage = JSON.parse(JSON.stringify(image));
    await saveRecipeMedia(recipeImage);
  }

  for (const image of deletedImages) {
    if (image.id) {
      await deleteRecipeMedia(image.id);
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

async function addImage() {
  let success = true;

  try {
    let result;

    const imagePicked = await pickImage((status) => isProcessingImage.value = status)
    if (!imagePicked) {
      return;
    }

    const mediaIndex = images.value.push(new RecipeMedia(id.value, "img", imagePicked));
    item.value.imageAvailable = true;
    selectedImage.value = mediaIndex - 1;
  } catch {
    success = false;
  } finally {
    if (!success) {
      notify(
        {
          group: "error",
          title: t("general.error"),
          text: t("pages.recipe.id.edit.failedToProcessImage"),
        },
        2000
      );
    }
  }
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

async function importRecipeFromUrl() {
  let success = true;
  try {
    isImportFromUrlModalOpen.value = false;
    isImporting.value = true;
    const result = await fetchWithRetry("/api/parse-recipe", {
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
    item.value.nutrition = html.nutrients;
    item.value.nutrition.servingSize = html.yields;
    item.value.language = html.language;

    if (html.image) {
      images.value.push(new RecipeMedia(id.value, "img", html.image));
    }

    item.value.imageAvailable = images.value.length > 0;

    if (editInSingleTextArea.value) {
      ingredientsText.value = item.value.ingredients.join("\n");
      stepsText.value = item.value.steps.join("\n");
    }
  }
  catch {
    isImportFromUrlModalOpen.value = true;
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

async function importRecipeFromCode() {
  let success = true;
  try {
    isImportFromShareModalOpen.value = false;
    isImporting.value = true;
    const result = await fetchWithRetry("/api/receive-recipe", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: `{"code": "${importRecipeCode.value}"}`
    });


    success = result.ok;
    if (!result.ok) {
      return;
    }

    const importRecipe = await result.json();
    item.value.title = importRecipe.title;
    item.value.score = 5;
    item.value.notes = importRecipe.notes;
    item.value.ingredients = importRecipe.ingredients;
    item.value.steps = importRecipe.steps;
    item.value.language = importRecipe.language;
    images.value = importRecipe.media.map((item: any) => {
      return new RecipeMedia(id.value, item.type, item.url);
    });

    item.value.imageAvailable = images.value.length > 0;
  }
  catch {
    isImportFromUrlModalOpen.value = true;
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

async function fillUrlFromClipboard(type: "recipe" | "video") {
  if (navigator.clipboard) {
    navigator.clipboard
      .readText()
      .then((clipText) => {
        if (clipText.startsWith("https://") || clipText.startsWith("http://")) {
          if (type === "recipe") {
            importRecipeUrl.value = clipText;
          } else {
            addVideoUrl.value = clipText;
          }
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

async function fillCodeFromClipboard() {
  if (navigator.clipboard) {
    navigator.clipboard
      .readText()
      .then((clipText) => {
        importRecipeCode.value = clipText;
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

function pickVideo() {
  isAddVideoModalOpen.value = true;
}

function cropImagechanged(changed: any) {
  croppingCanvas = changed.canvas;
}

function cropImage() {
  images.value[selectedImage.value].url = croppingCanvas.toDataURL();
  isCropping.value = false;
}

function cancelCropping() {
  isCropping.value = false;
  selectedImage.value = 0;
  currentImage.value = images.value[0].url;
}

function addVideo() {
  const isSupported = isVideoUrlSupported(addVideoUrl.value);
  if (!isSupported) {
    addVideoUrlError.value = t("pages.recipe.id.edit.videoUrlNotSupported");
    return;
  } else {
    addVideoUrlError.value = "";
  }

  const videoUrl = prepareUrlForEmbed(addVideoUrl.value);

  if (!videoUrl) {
    addVideoUrlError.value = t("pages.recipe.id.edit.videoUrlNotSupported");
  }

  const videoIndex = images.value.push(new RecipeMedia(id.value, "vid", videoUrl));
  item.value.imageAvailable = true;
  selectedImage.value = videoIndex - 1;

  isAddVideoModalOpen.value = false;
}

function changeLanguage() {
  item.value.language = selectedLanguage.value;
  isLanguageModalOpen.value = false;
}
</script>

<template>
  <div>
    <div v-if="!isCropping">
      <ImageGallery v-if="item.imageAvailable" @selectionChanged="selectedImage = $event" :images="images" />
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
    <cropper v-if="isCropping" class="cropper h-80" @change="cropImagechanged" :src="currentImage" />
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
          " :title="t('pages.recipe.id.edit.addImageTooltip')" data-testid="add-image-button" @click="addImage">
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
          " :title="t('pages.recipe.id.edit.addVideoTooltip')" data-testid="add-video-button" @click="pickVideo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 text-white m-auto">
            <path fill="currentColor"
              d="M13 19C13 19.34 13.04 19.67 13.09 20H4C2.9 20 2 19.11 2 18V6C2 4.89 2.9 4 4 4H5L7 8H10L8 4H10L12 8H15L13 4H15L17 8H20L18 4H22V13.81C21.39 13.46 20.72 13.22 20 13.09V10H5.76L4 6.47V18H13.09C13.04 18.33 13 18.66 13 19M20 18V15H18V18H15V20H18V23H20V20H23V18H20Z" />
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
          " :title="t('pages.recipe.id.edit.removeImageTooltip')" data-testid="remove-image-button"
          @click="removeImage">
          <svg class="h-5 w-5 text-white m-auto" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M13 19C13 19.7 13.13 20.37 13.35 21H5C3.9 21 3 20.11 3 19V5C3 3.9 3.9 3 5 3H19C20.11 3 21 3.9 21 5V13.35C20.37 13.13 19.7 13 19 13V5H5V19H13M11.21 15.83L9.25 13.47L6.5 17H13.35C13.75 15.88 14.47 14.91 15.4 14.21L13.96 12.29L11.21 15.83M22.54 16.88L21.12 15.47L19 17.59L16.88 15.47L15.47 16.88L17.59 19L15.47 21.12L16.88 22.54L19 20.41L21.12 22.54L22.54 21.12L20.41 19L22.54 16.88Z" />
          </svg>
        </button>

        <button v-if="item.imageAvailable && currentMediaIsImage && !isCropping" class="
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
          " :title="t('pages.recipe.id.edit.cropTooltip')" data-testid="crop-button" @click="isCropping = true">
          <svg class="h-6 w-6 text-white m-auto" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <path d="M8 5v10a1 1 0 0 0 1 1h10" />
            <path d="M5 8h10a1 1 0 0 1 1 1v10" />
          </svg>
        </button>
        <button v-if="item.imageAvailable && isCropping" class="
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
          " :title="t('pages.recipe.id.edit.cancelCropTooltip')" data-testid="cancel-crop-button"
          @click="cancelCropping">
          <svg class="h-5 w-5 text-white m-auto" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button v-if="isCropping" class="
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
          " :title="t('pages.recipe.id.edit.acceptCropTooltip')" data-testid="accept-crop-button" @click="cropImage">
          <svg class="h-5 w-5 text-white m-auto" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <path d="M5 12l5 5l10 -10" />
          </svg>
        </button>
        <RoundButton v-if="enableRecipeLanguageSwitcher" :title="t('pages.recipe.id.edit.changeLanguage')"
          test-id="change-lang-button" @click="() => isLanguageModalOpen = true">
          <svg class="h-5 w-5 text-white m-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px"
            fill="#ffffff">
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        </RoundButton>
      </div>
    </div>
    <div>
      <label for="title">{{ t("pages.recipe.id.edit.title") }}</label>
      <input id="title" type="text" v-model="item.title" class="block p-2 w-full rounded text-black shadow-sm" />
      <label>{{ t("pages.recipe.id.edit.rating") }}</label>
      <RatingPicker class="mb-2" v-model="item.score" />
      <label for="category">{{ t("pages.recipe.id.edit.category") }}</label>
      <select id="category" v-model="item.categoryId" class="block p-2 w-full rounded text-black shadow-sm">
        <option value="0" disabled>{{ t('pages.recipe.id.edit.selectCategory') }}</option>
        <option v-for="category in categories" :value="category.id">{{ category.name }}</option>
      </select>
      <label>{{ t("pages.recipe.id.edit.ingredients") }}</label>
      <button v-if="!editInSingleTextArea" class="ml-2 align-middle" type="button"
        :title="t('pages.recipe.id.edit.addIngredient')" @click="addIngredientAt(item.ingredients.length - 1)">
        <svg class="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <textarea v-if="editInSingleTextArea" v-model="ingredientsText" name="ingredients" id="ingredients" class="block
          p-2
          mb-3
          flex-auto
          w-full
          bg-white
          rounded
          text-base text-black" rows="10"></textarea>
      <div v-else class="flex my-3 w-full" v-for="(ingredient, index) in item.ingredients">
        <input type="text" :placeholder="t('pages.recipe.id.edit.ingredientPlaceholder')"
          v-model="item.ingredients[index]" @keyup.enter="addIngredientAt(index)" ref="ingredientRefs"
          class="block p-2 rounded flex-auto text-black shadow-sm" />
        <button type="button" class="ml-2 align-middle" :title="t('pages.recipe.id.edit.deleteIngredient')"
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
      <button v-if="!editInSingleTextArea" class="ml-2" type="button" :title="t('pages.recipe.id.edit.addStep')"
        @click="addStepAt(item.steps.length - 1)">
        <svg class="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <textarea v-if="editInSingleTextArea" v-model="stepsText" name="steps" id="steps" class="block
          p-2
          mb-3
          flex-auto
          w-full
          bg-white
          rounded
          text-base text-black" rows="10"></textarea>
      <div v-else class="flex my-3 w-full" v-for="(step, index) in item.steps">
        <input type="text" :placeholder="t('pages.recipe.id.edit.stepPlaceholder')" v-model="item.steps[index]"
          class="block p-2 flex-auto rounded text-black shadow-sm" ref="stepRefs" @keyup.enter="addStepAt(index)" />
        <button type="button" class="ml-2" :title="t('pages.recipe.id.edit.deleteStep')"
          @click="item.steps.splice(index, 1)">
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
          mb-3
          flex-auto
          w-full
          h-20
          bg-white
          rounded
          text-base text-black
        " />
      <label for="nutritionFacts" v-if="enableNutritionFacts">{{ t("pages.recipe.id.edit.nutrition") }}</label>
      <div class="my-3 w-full" v-if="enableNutritionFacts">
        <div class="flex my-3">
          <label for="servingSize" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.servingSize") }}</label>
          <input id="servingSize" type="text" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.servingSize" />
        </div>
        <div class="flex my-3">
          <label for="calories" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.calories") }}</label>
          <input id="calories" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.calories" />
        </div>
        <div class="flex flex-row my-3">
          <label for="totalFat" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.totalFat") }}</label>
          <input id="totalFat" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.totalFat" />
        </div>
        <div class="flex my-3">
          <label for="saturatedFat" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.saturatedFat") }}</label>
          <input id="saturatedFat" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.saturatedFat" />
        </div>
        <div class="flex my-3">
          <label for="transFat" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.transFat") }}</label>
          <input id="transFat" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.transFat" />
        </div>
        <div class="flex my-3">
          <label for="cholesterol" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.cholesterol") }}</label>
          <input id="cholesterol" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.cholesterol" />
        </div>
        <div class="flex my-3">
          <label for="sodium" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.sodium") }}</label>
          <input id="sodium" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.sodium" />
        </div>
        <div class="flex my-3">
          <label for="carbohydrates" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.carbohydrates") }}</label>
          <input id="carbohydrates" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.carbohydrates" />
        </div>
        <div class="flex my-3">
          <label for="fiber" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.fiber") }}</label>
          <input id="fiber" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.fiber" />
        </div>
        <div class="flex my-3">
          <label for="sugar" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.sugar") }}</label>
          <input id="sugar" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.sugar" />
        </div>
        <div class="flex my-3">
          <label for="protein" class="block p-2 w-52 rounded text-black dark:text-white">{{
            t("pages.recipe.id.edit.protein") }}</label>
          <input id="protein" type="number" class="block p-2 grow rounded text-black shadow-sm"
            v-model="item.nutrition.protein" />
        </div>
      </div>
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
    <Modal :isOpen="isImportFromUrlModalOpen" @closed="isImportFromUrlModalOpen = false"
      :title="t('pages.recipe.id.edit.importTitle')" :buttons="[
        {
          title: t('pages.recipe.id.edit.importFromClipboard'),
          action: async () => {
            await fillUrlFromClipboard('recipe');
          }
        },
        {
          title: t('general.cancel'),
          action: () => isImportFromUrlModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: importRecipeFromUrl,
        },
      ]">
      <input type="url" v-model="importRecipeUrl" data-testid="import-url"
        class="block my-2 p-2 w-full rounded text-black shadow-sm" />
    </Modal>
    <Modal :isOpen="isAddVideoModalOpen" @closed="isAddVideoModalOpen = false"
      :title="t('pages.recipe.id.edit.addVideoTitle')" :buttons="[
        {
          title: t('pages.recipe.id.edit.importFromClipboard'),
          action: async () => {
            await fillUrlFromClipboard('video');
          }
        },
        {
          title: t('general.cancel'),
          action: () => isAddVideoModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: addVideo,
        },
      ]">
      <input type="url" v-model="addVideoUrl" data-testid="add-video-url"
        class="block my-2 p-2 w-full rounded text-black shadow-sm" />
      <span class="mt-2 text-sm text-red-500">{{ addVideoUrlError }}</span>
    </Modal>
    <Modal :isOpen="isImportFromShareModalOpen" @closed="isImportFromShareModalOpen = false"
      :title="t('pages.recipe.id.edit.importFromShareTitle')" :buttons="[
        {
          title: t('pages.recipe.id.edit.importFromShareFromClipboard'),
          action: async () => {
            await fillCodeFromClipboard();
          }
        },
        {
          title: t('general.cancel'),
          action: () => isImportFromShareModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: importRecipeFromCode,
        },
      ]">
      <input v-model="importRecipeCode" data-testid="import-code"
        class="block my-2 p-2 w-full rounded text-black shadow-sm" />
    </Modal>
    <Modal :isOpen="isLanguageModalOpen" @closed="isLanguageModalOpen = false"
      :title="t('pages.recipe.id.edit.changeLanguageTitle')" :buttons="[
        {
          title: t('general.cancel'),
          action: () => isLanguageModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: changeLanguage,
        },
      ]">
      <div v-for="language in availableLanguages">
        <input :id="`lang_${language}`" type="radio" :value="language" v-model="selectedLanguage" />
        <label :for="`lang_${language}`" class="dark:text-white ml-2">{{ t(`pages.options.${language}`) }}</label>
      </div>
    </Modal>
    <BusyIndicator :busy="isImporting" :message1="t('pages.recipe.id.edit.importContent1')"
      :message2="t('pages.recipe.id.edit.importContent2')" />

    <BusyIndicator :busy="isProcessingImage" :message1="t('pages.recipe.id.edit.processImage1')"
      :message2="t('pages.recipe.id.edit.processImage2')" />
  </div>
</template>