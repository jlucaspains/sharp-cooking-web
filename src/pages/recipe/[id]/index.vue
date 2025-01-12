<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRecipe,
  getRecipeMediaList,
  deleteRecipe,
  prepareRecipeBackup,
  saveRecipe,
  getSetting,
} from "../../../services/dataService";
import { useState } from "../../../services/store";
import { RecipeViewModel } from "../recipeViewModel";
import Modal from "../../../components/Modal.vue";
import TimePicker from "../../../components/TimePicker.vue";
import { notify } from "notiwind";
import { getImpliedTimeFromString, secondsToString } from "../../../helpers/timeHelpers";
import { IngredientDisplay, InstructionDisplay, prepareIngredientDisplay, prepareStepDisplay, applyMultiplierToString } from "../../../helpers/multiplierHelpers";
import NoSleep from "nosleep.js";
import { fileSave } from "browser-fs-access";
import { useTranslation } from "i18next-vue";
import ImageGallery from "../../../components/ImageGallery.vue";
import BusyIndicator from "../../../components/BusyIndicator.vue";
import { RecipeMedia } from "../../../services/recipe";
import i18next from "i18next";
import NutritionFacts from "../../../components/NutritionFacts.vue";
import { recipeAsText } from "../../../helpers/shareHelpers";

const route = useRoute();
const router = useRouter();

const id = computed(() => parseInt(route.params.id as string));
const state = useState()!;
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  multiplier: 1,
  changedOn: "",
  image: "",
  imageAvailable: false,
  hasNotes: false
} as RecipeViewModel);
const display = ref([{ time: "", title: "", subItems: [] as string[] }]);
const displayIngredients = ref([] as IngredientDisplay[]);
const selectedIngredient = ref({} as IngredientDisplay);
const displayInstructions = ref([] as InstructionDisplay[])
const selectedInstruction = ref({} as InstructionDisplay);
const isMultiplierModalOpen = ref(false);
const isTimeModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const startTime = ref("");
const finishTime = ref(new Date());
const currentStartTime = ref(new Date());
const newMultiplier = ref(1);
const images = ref([] as Array<RecipeMedia>);
const isIngredientDetailsModalOpen = ref(false);
const isBusy = ref(false);
const isShareOptionsModalOpen = ref(false);
const shareCode = ref("");
const shareQRCode = ref("");
const isInstructionDetailsModalOpen = ref(false);
const isNutritionFactsModalOpen = ref(false);
const { t } = useTranslation();

const noSleep = new NoSleep();
let defaultTimeSetting = "5";
let useFractionsOverDecimal = false;
let enableNutritionFacts = false;
let enableAiChat = false;

function confirmDeleteItem() {
  isDeleteModalOpen.value = true;
}

async function deleteItem() {
  try {
    isDeleteModalOpen.value = false;
    await deleteRecipe(item.value.id || 0);
    notify(
      {
        group: "success",
        title: t("general.success"),
        text: t("pages.recipe.id.index.recipeDeleted"),
      },
      2000
    );
    router.back();
  } catch {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.index.recipeDeleteFailed"),
      },
      2000
    );
  }
}

onMounted(async () => {
  defaultTimeSetting = await getSetting("StepsInterval", "5");
  const useFractionsOverDecimalString = await getSetting("UseFractions", "false");
  useFractionsOverDecimal = useFractionsOverDecimalString == "true";
  const enableNutritionFactsString = await getSetting("EnableNutritionFacts", "false");
  enableNutritionFacts = enableNutritionFactsString == "true";

  const enableAiChatString = await getSetting("EnableAiChat", "false");
  enableAiChat = enableAiChatString == "true";

  setupMenuOptions();

  const recipe = (await getRecipe(id.value)) as RecipeViewModel;
  const currentTime = new Date();
  prepareDisplay(recipe, currentTime);
  display.value = getDisplayValues(recipe, currentTime);

  if (recipe) {
    state.title = recipe.title;

    const allImages = await getRecipeMediaList(id.value);

    if (allImages.length > 0) {
      allImages.forEach((item) => {
        images.value.push(item)
      });
      recipe.imageAvailable = images.value.length > 0;
    }
    recipe.hasNotes = !!recipe.notes;

    item.value = recipe;
  }

});

function setupMenuOptions() {
  let menuOptions = [
    {
      text: t("pages.recipe.id.index.more"),
      children: [
        {
          text: t("pages.recipe.id.index.delete"),
          action: confirmDeleteItem,
        },
        {
          text: t("pages.recipe.id.index.shareAsText"),
          action: shareAsText,
        },
        {
          text: t("pages.recipe.id.index.shareAsFile"),
          action: shareAsFile,
        },
        {
          text: t("pages.recipe.id.index.shareOnline"),
          action: shareOnline,
        }
      ],
      svg: `<circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" />`,
    },
  ];
  if (enableAiChat) {
    menuOptions[0].children.push({
      text: t("pages.recipe.id.index.chatWithAssistant"),
      action: goToChat,
    });
  }
  state.menuOptions = menuOptions;
}

function parseTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function prepareDisplay(
  recipe: RecipeViewModel,
  currentTime: Date
): void {
  currentStartTime.value = new Date(currentTime);
  const defaultTime = parseInt(defaultTimeSetting);
  let language = recipe.language;
  
  if (!language)
    language = i18next.language;

  displayIngredients.value = recipe.ingredients.map((ingredient) =>
    prepareIngredientDisplay(
      ingredient,
      recipe.multiplier,
      useFractionsOverDecimal,
      language,
      true
    )
  );
  let nextTime = currentTime;
  nextTime.setTime(nextTime.getTime() + defaultTime * 60 * 1000);
  displayInstructions.value = recipe.steps.map((step) => {
    const result = prepareStepDisplay(step, nextTime, language, true);

    if (result.timeInSeconds > 0) {
      nextTime.setTime(nextTime.getTime() + result.timeInSeconds * 1000);
    } else {
      nextTime.setTime(nextTime.getTime() + defaultTime * 60 * 1000);
    }

    return result;
  });
  finishTime.value = new Date(nextTime);
}

function getDisplayValues(
  recipe: RecipeViewModel,
  currentTime: Date
): Array<{ time: string; title: string; subItems: string[] }> {
  const result: Array<{ time: string; title: string; subItems: string[] }> = [];

  const ingredientTitle = `${t("pages.recipe.id.index.ingredients")} (${recipe.multiplier || 1}x)`;

  result.push({
    time: parseTime(currentTime),
    title: ingredientTitle,
    subItems: recipe.ingredients.map((ingredient) =>
      applyMultiplierToString(
        ingredient,
        recipe.multiplier,
        t("logic.ingredientRegex"),
        useFractionsOverDecimal,
        recipe.language ?? i18next.language
      )
    ),
  });

  const defaultTime = parseInt(defaultTimeSetting) * 60 * 1000;
  currentTime.setTime(currentTime.getTime() + defaultTime);

  recipe.steps.forEach((step, index) => {
    result.push({
      time: parseTime(currentTime),
      title: `${t('pages.recipe.id.index.step')} ${index + 1}`,
      subItems: [step],
    });

    const impliedTime = getImpliedTimeFromString(
      step,
      t("logic.stepRegex")
    );
    const actualTime = impliedTime > 0 ? impliedTime : defaultTime;
    currentTime.setTime(currentTime.getTime() + actualTime);
  });

  result.push({
    time: parseTime(currentTime),
    title: t("pages.recipe.id.index.enjoy"),
    subItems: [],
  });

  return result;
}

function editItem() {
  router.push(`/recipe/${id.value}/edit`);
}

async function toggleScreenLight() {
  if (noSleep.isEnabled) {
    noSleep.disable();
    notify(
      {
        group: "success",
        title: t("pages.recipe.id.index.toggleScreenOnTitle"),
        text: t("pages.recipe.id.index.toggleScreenOnDisabled"),
      },
      2000
    );
  } else {
    await noSleep.enable();
    notify(
      {
        group: "success",
        title: t("pages.recipe.id.index.toggleScreenOnTitle"),
        text: t("pages.recipe.id.index.toggleScreenOnEnabled"),
      },
      2000
    );
  }
}

function changeMultiplier() {
  isMultiplierModalOpen.value = true;
}

async function applyMultiplier() {
  item.value.multiplier = newMultiplier.value;

  const currentTime = new Date();
  prepareDisplay(item.value, currentTime);
  display.value = getDisplayValues(item.value, currentTime);

  isMultiplierModalOpen.value = false;

  const recipe = JSON.parse(JSON.stringify(item.value));
  await saveRecipe(recipe);
}

function printItem() {
  router.push(`/recipe/${id.value}/print`);
}

function showNutrition() {
  isNutritionFactsModalOpen.value = true;
}

function goToChat() {
  router.push(`/recipe/${id.value}/chat`);
}

function changeTime() {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  startTime.value = `${hours}:${minutes}`;

  isTimeModalOpen.value = true;
}

function setDisplayTime() {
  const currentTime = new Date();

  const year = currentTime.getFullYear().toString();
  const month = (currentTime.getMonth() + 1).toString().padStart(2, "0");
  const date = currentTime.getDate().toString().padStart(2, "0");

  const newDate = new Date(`${year}-${month}-${date}T${startTime.value}`);

  prepareDisplay(item.value, newDate);
  display.value = getDisplayValues(item.value, newDate);

  isTimeModalOpen.value = false;
}

async function shareAsText() {
  if (navigator.share) {
    await navigator
      .share({
        title: item.value.title,
        text: recipeAsText(item.value),
      })
  } else {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.index.sharingNotSupported"),
      },
      2000
    );
  }
}

async function shareAsFile() {
  try {
    const backup = await prepareRecipeBackup(id.value);

    const stringBackup = JSON.stringify(backup);
    const blob = new Blob([stringBackup]);
    await fileSave(blob, { fileName: "sharp_cooking.json", mimeTypes: ["application/json"] });

    notify(
      {
        group: "success",
        title: t("general.success"),
        text: t("pages.recipe.id.index.sharingSucceeded"),
      },
      2000
    )
  } catch (e) {
    if (e instanceof DOMException && e.ABORT_ERR == DOMException.ABORT_ERR) {
      return;
    }

    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.index.sharingFailed"),
      },
      2000
    );
  }
}

async function shareOnline() {
  try {
    isBusy.value = true;
    shareCode.value = "";

    const model = {
      id: item.value.id,
      title: item.value.title,
      ingredients: item.value.ingredients,
      notes: item.value.notes,
      source: item.value.source,
      steps: item.value.steps,
      media: images.value.map(item => {
        return { "type": item.type, "url": item.url };
      }),
    };

    const response = await fetch("/api/share-recipe", {
      method: "POST",
      body: JSON.stringify(model)
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();
    shareCode.value = result.id;
    shareQRCode.value = result.qrCode;

    isShareOptionsModalOpen.value = true;

  } catch (e) {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.index.sharingFailed"),
      },
      2000
    );
  } finally {
    isBusy.value = false;
  }
}

async function shareOnlineAsUrl(code: string) {
  try {
    await navigator.share({ title: t("pages.recipe.id.index.shareOnline"), text: code, url: `${window.location.origin}/#/recipe/0/edit?importFromShare=1&shareCode=${code}` });
  } catch (e) {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.index.sharingFailed"),
      },
      2000
    );
  }
}

async function shareOnlineAsCode(code: string) {
  try {
    await navigator.share({ title: t("pages.recipe.id.index.shareOnline"), text: `Use code ${code} to import recipe into Sharp Cooking app.` });
  } catch (e) {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.recipe.id.index.sharingFailed"),
      },
      2000
    );
  }
}

function showIngredientDetails(item: IngredientDisplay) {
  selectedIngredient.value = item;
  isIngredientDetailsModalOpen.value = true;
}

function showInstructionDetails(item: InstructionDisplay) {
  selectedInstruction.value = item;
  isInstructionDetailsModalOpen.value = true;
}

function nutritionHasValues(): boolean {
  return item.value.nutrition.calories > 0
    || item.value.nutrition.totalFat > 0
    || item.value.nutrition.saturatedFat > 0
    || item.value.nutrition.unsaturatedFat > 0
    || item.value.nutrition.transFat > 0
    || item.value.nutrition.carbohydrates > 0
    || item.value.nutrition.sugar > 0
    || item.value.nutrition.cholesterol > 0
    || item.value.nutrition.sodium > 0
    || item.value.nutrition.protein > 0
    || item.value.nutrition.fiber > 0;
}
</script>

<template>
  <div>
    <h1 class="print-only text-lg font-semibold whitespace-nowrap">
      {{ item.title }}
    </h1>
    <ImageGallery v-if="item.imageAvailable" :images="images" />
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
    <div class="no-print float-right h-20">
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
        " :title="t('pages.recipe.id.index.editTooltip')" data-testid="edit-button" @click="editItem">
        <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
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
        " :title="t('pages.recipe.id.index.keepScreenOnTooltip')" data-testid="toggle-screen-button"
        @click="toggleScreenLight">
        <svg class="h-5 w-5 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
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
        " :title="t('pages.recipe.id.index.multiplierTooltip')" data-testid="multiplier-button"
        @click="changeMultiplier">
        <svg class="h-5 w-5 text-white m-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
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
        " :title="t('pages.recipe.id.index.startTimeTooltip')" data-testid="time-button" @click="changeTime">
        <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 15" />
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
        " :title="t('pages.recipe.id.index.printTooltip')" data-testid="print-button" @click="printItem">
        <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" />
          <path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" />
          <rect x="7" y="13" width="10" height="8" rx="2" />
        </svg>
      </button>
      <button v-if="enableNutritionFacts" class="
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
        " :title="t('pages.recipe.id.index.printTooltip')" data-testid="nutrition-button" @click="showNutrition">

        <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path
            d="M20,10C22,13 17,22 15,22C13,22 13,21 12,21C11,21 11,22 9,22C7,22 2,13 4,10C6,7 9,7 11,8V5C5.38,8.07 4.11,3.78 4.11,3.78C4.11,3.78 6.77,0.19 11,5V3H13V8C15,7 18,7 20,10Z" />
        </svg>

      </button>
    </div>
    <div class="grid grid-cols-12 w-full mt-7">
      <div class="lg:col-span-1 sm:col-span-2 col-span-3 mt-3">
        {{ parseTime(currentStartTime) }}
      </div>
      <div class="-ml-3.5 mt-3">
        <svg class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div class="lg:col-span-10 sm:col-span-9 col-span-8 mt-3">
        {{ t('pages.recipe.id.index.ingredients') }} ({{ item.multiplier }}x)
      </div>
      <template v-for="subItem in displayIngredients">
        <div class="lg:col-span-1 sm:col-span-2 col-span-3"></div>
        <div class="border-l-4 border-theme-secondary"></div>
        <div class="lg:col-span-10 sm:col-span-9 col-span-8" @click="showIngredientDetails(subItem)"
          v-html="subItem.text">
        </div>
      </template>
      <template v-for="(displayItem, index) in displayInstructions">
        <div class="lg:col-span-1 sm:col-span-2 col-span-3 mt-3">
          {{ parseTime(displayItem.startTime) }}
        </div>
        <div class="-ml-3.5 mt-3">
          <svg class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div class="lg:col-span-10 sm:col-span-9 col-span-8 mt-3">
          {{ t('pages.recipe.id.index.step') }} {{ index + 1 }}
        </div>
        <div class="lg:col-span-1 sm:col-span-2 col-span-3"></div>
        <div class="border-l-4 border-theme-secondary"></div>
        <div class="lg:col-span-10 sm:col-span-9 col-span-8" v-html="displayItem.text"
          @click="showInstructionDetails(displayItem)">
        </div>
      </template>
      <div class="lg:col-span-1 sm:col-span-2 col-span-3 mt-3">
        {{ parseTime(finishTime) }}
      </div>
      <div class="-ml-3.5 mt-3">
        <svg class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <div class="lg:col-span-10 sm:col-span-9 col-span-8 mt-3">
        {{ t('pages.recipe.id.index.enjoy') }}
      </div>
    </div>
    <h2 v-if="item.hasNotes" class="mt-4">{{ t("pages.recipe.id.index.notes") }}</h2>
    <div v-if="item.hasNotes" class="steps">
      {{ item.notes }}
    </div>
    <Modal :isOpen="isMultiplierModalOpen" @closed="isMultiplierModalOpen = false"
      :title="t('pages.recipe.id.index.multiplierTitle')" :buttons="[
        {
          title: t('general.cancel'),
          action: () => {
            isMultiplierModalOpen = false;
          },
        },
        {
          title: t('general.ok'),
          action: applyMultiplier,
        },
      ]">
      <span class="dark:text-white">Enter decimal value of quantity. E.g. 0.5 or 2</span>
      <input @keyup.enter="applyMultiplier" data-testid="multiplier-value" type="number" v-model="newMultiplier"
        class="block my-2 p-2 w-full rounded text-black" />
    </Modal>
    <Modal :isOpen="isTimeModalOpen" @closed="isTimeModalOpen = false"
      :title="t('pages.recipe.id.index.startTimeTitle')" :buttons="[
        {
          title: t('general.cancel'),
          action: () => {
            isTimeModalOpen = false;
          },
        },
        {
          title: t('general.ok'),
          action: setDisplayTime,
        },
      ]">
      <TimePicker @keyup.enter="setDisplayTime" data-testid="time-value" v-model="startTime"></TimePicker>
    </Modal>
    <Modal :isOpen="isDeleteModalOpen" @closed="isDeleteModalOpen = false"
      :title="t('pages.recipe.id.index.deleteModalTitle')" :buttons="[
        {
          title: t('general.no'),
          action: () => {
            isDeleteModalOpen = false;
          },
        },
        {
          title: t('pages.recipe.id.index.deleteYes'),
          danger: true,
          action: deleteItem,
        },
      ]">
      <span class="dark:text-white">{{ t("pages.recipe.id.index.deleteModalBody") }}</span>
    </Modal>
    <Modal :isOpen="isIngredientDetailsModalOpen" @closed="isIngredientDetailsModalOpen = false"
      :title="t('pages.recipe.id.index.ingredientDetailsModalTitle')" :buttons="[
        {
          title: t('general.ok'),
          action: () => {
            isIngredientDetailsModalOpen = false;
          },
        }
      ]">
      <div class="dark:text-white" v-if="selectedIngredient.minQuantity != selectedIngredient.maxQuantity">{{
        t("pages.recipe.id.index.ingredientDetailsQuantity") }} {{
        selectedIngredient.minQuantity }} - {{ selectedIngredient.maxQuantity }}</div>
      <div class="dark:text-white" v-else>{{ t("pages.recipe.id.index.ingredientDetailsQuantity") }}{{ }} {{
        selectedIngredient.quantityValue }}</div>
      <div class="dark:text-white">{{ t("pages.recipe.id.index.ingredientDetailsUOM") }} {{ selectedIngredient.unit }}
      </div>
      <div class="dark:text-white">{{ t("pages.recipe.id.index.ingredientDetailsIngredient") }} {{
        selectedIngredient.ingredient }}</div>
      <div v-if="selectedIngredient.alternativeQuantities.length > 0">
        <div class="dark:text-white mt-3">{{ t("pages.recipe.id.index.ingredientDetailsAlternativeUOMs") }}</div>
        <div class="dark:text-white">
          <table role="presentation" aria-label="{{ t('pages.recipe.id.index.ingredientDetailsModalTitle') }}">
            <tr v-for="item in selectedIngredient.alternativeQuantities">
              <td class="float-right my-1 mx-2">{{ item.quantity }}</td>
              <td>{{ item.unitText }}</td>
            </tr>
          </table>
        </div>
      </div>
    </Modal>
    <Modal :isOpen="isShareOptionsModalOpen" @closed="isShareOptionsModalOpen = false"
      :title="t('pages.recipe.id.index.shareOnline')" :buttons="[
        {
          title: 'Share to Android or Windows',
          action: async () => {
            await shareOnlineAsUrl(shareCode);
            isShareOptionsModalOpen = false;
          },
        },
        {
          title: 'Share to iOS',
          action: async () => {
            await shareOnlineAsCode(shareCode);
            isShareOptionsModalOpen = false;
          },
        }
      ]">
      <div class="text-center my-6">
        <div class="bg-white w-60 m-auto" v-html="shareQRCode"></div>
        <span class="text-2xl dark:text-white" data-testid="actual-share-code">{{ shareCode }}</span>
      </div>
    </Modal>
    <BusyIndicator :busy="isBusy" :message1="t('pages.recipe.id.index.shareOnline1')"
      :message2="t('pages.recipe.id.index.shareOnline2')" />
    <Modal :isOpen="isInstructionDetailsModalOpen" @closed="isInstructionDetailsModalOpen = false"
      :title="t('pages.recipe.id.index.stepDetailsModalTitle')" :buttons="[
        {
          title: t('general.ok'),
          action: () => {
            isInstructionDetailsModalOpen = false;
          },
        }
      ]">
      <div class="dark:text-white">{{ t("pages.recipe.id.index.stepDetailsTime") }} {{
        secondsToString(selectedInstruction.timeInSeconds, t) }}</div>
      <div class="dark:text-white">{{ t("pages.recipe.id.index.stepDetailsTemperature") }} {{
        selectedInstruction.temperature }} {{ selectedInstruction.temperatureUnit }}</div>
      <div v-if="selectedInstruction.alternativeTemperatures.length > 0" class="dark:text-white mt-3">{{
        t("pages.recipe.id.index.stepDetailsAlternativeTemperatures") }}</div>
      <div class="dark:text-white">
        <table v-if="selectedInstruction.alternativeTemperatures.length > 0" role="presentation"
          aria-label="{{ t('pages.recipe.id.index.stepDetailsModalTitle') }}">
          <tr v-for="item in selectedInstruction.alternativeTemperatures">
            <td class="float-right my-1 mx-2">{{ item.quantity }}</td>
            <td>{{ item.unitText }}</td>
          </tr>
        </table>
      </div>
    </Modal>
    <Modal :isOpen="isNutritionFactsModalOpen" @closed="isNutritionFactsModalOpen = false" title="" :buttons="[
        {
          title: t('general.ok'),
          action: () => {
            isNutritionFactsModalOpen = false;
          },
        }
      ]">
      <NutritionFacts v-if="nutritionHasValues()" class="mx-auto" :nutrition="item.nutrition"
        :serving-per-container="item.nutrition.servingSize" item-name=""></NutritionFacts>
      <span class="dark:text-white text-black" v-else>{{ t("pages.recipe.id.index.noNutritionFacts") }}</span>
    </Modal>
  </div>
</template>

<style>
ul li {
  border-color: white;
}
</style>