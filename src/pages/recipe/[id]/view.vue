<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
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
import { secondsToString } from "../../../helpers/timeHelpers";
import { IngredientDisplay, InstructionDisplay, prepareIngredientDisplay, prepareStepDisplay } from "../../../helpers/multiplierHelpers";
import NoSleep from "@scottjgilroy/no-sleep";
import { fileSave } from "browser-fs-access";
import { useTranslation } from "i18next-vue";
import ImageGallery from "../../../components/ImageGallery.vue";
import BusyIndicator from "../../../components/BusyIndicator.vue";
import { RecipeMedia } from "../../../services/recipe";
import i18next from "i18next";
import NutritionFacts from "../../../components/NutritionFacts.vue";
import { recipeAsText } from "../../../helpers/shareHelpers";
import TagIcon from "../../../components/TagIcon.vue";
import { DIET_TAGS, getDisplayTags } from "../../../services/dietTags";

const route = useRoute();
const router = useRouter();

const id = computed(() => parseInt(route.params.id as string));
const displayTags = computed(() => getDisplayTags(item.value.tags ?? []));
const state = useState()!;
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  tags: [] as string[],
  notes: "",
  multiplier: 1,
  changedOn: "",
  image: "",
  imageAvailable: false,
  hasNotes: false
} as RecipeViewModel);
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
const completedSteps = ref(new Set<number>());
const { t } = useTranslation();

const noSleep = new NoSleep();
let defaultTimeSetting = "5";
let useFractionsOverDecimal = false;
let enableAiChat = false;
const isDietTagsEnabled = ref(false);

function toggleStepCompletion(index: number) {
  if (completedSteps.value.has(index)) {
    completedSteps.value.delete(index);
  } else {
    completedSteps.value.add(index);
  }
  completedSteps.value = new Set(completedSteps.value);
}

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

onBeforeUnmount(() => {
  state.useContainer = true;
});

onMounted(async () => {
  state.useContainer = false;

  defaultTimeSetting = await getSetting("StepsInterval", "5");
  const useFractionsOverDecimalString = await getSetting("UseFractions", "false");
  useFractionsOverDecimal = useFractionsOverDecimalString == "true";

  const enableAiChatString = await getSetting("EnableAiChat", "false");
  enableAiChat = enableAiChatString == "true";

  isDietTagsEnabled.value = (await getSetting("EnableDietTags", "false")) === "true";

  setupMenuOptions();

  const recipe = (await getRecipe(id.value)) as RecipeViewModel;
  const currentTime = new Date();
  prepareDisplay(recipe, currentTime);

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
      ingredients: item.value.ingredients.filter(ingredient => ingredient.trim() !== ""),
      notes: item.value.notes,
      source: item.value.source,
      steps: item.value.steps.filter(step => step.trim() !== ""),
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
    shareQRCode.value = result.qr_code
      // HACK: remove width and height from QR Code as library that generates it
      // doesn't have an option to remove it
      .replace("width=\"29mm\"", "").replace("height=\"29mm\"", "");

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
  <div class="mx-auto max-w-[1600px] px-4 pb-4">
    <div class="lg:grid lg:grid-cols-12 lg:gap-10">
      <aside class="lg:col-span-5 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div class="wide-hero-image" v-if="item.imageAvailable">
          <ImageGallery :images="images" />
        </div>
        <div class="
            bg-theme-primary
            rounded-lg
            grid
            place-items-center
            w-full
            h-40
            overflow-hidden
          " v-else>
          <svg class="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>

        <div v-if="isDietTagsEnabled && displayTags.length > 0" class="flex flex-wrap justify-center gap-2 mt-3">
          <span v-for="tagId in displayTags" :key="tagId"
            class="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-theme-gray text-black dark:text-white">
            <TagIcon :tag-id="tagId" />
            {{ t(DIET_TAGS.find((tag) => tag.id === tagId)?.labelKey ?? '') }}
          </span>
        </div>

        <div class="flex flex-wrap justify-center gap-2 mt-4">
          <button class="
              w-12
              h-12
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
          <button class="
              w-12
              h-12
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

        <div class="mt-6 border-t border-gray-300 dark:border-gray-600 pt-4">
          <span class="font-semibold text-lg">{{ t('pages.recipe.id.index.ingredients') }} ({{ item.multiplier }}x)</span>
          <div class="mt-2 space-y-2">
            <div v-for="subItem in displayIngredients" class="pl-3 border-l-4 border-theme-secondary cursor-pointer"
              @click="showIngredientDetails(subItem)" v-html="subItem.text">
            </div>
          </div>
        </div>
      </aside>

      <section class="lg:col-span-7 mt-7 lg:mt-0">
        <span class="font-semibold text-lg">{{ t('pages.recipe.id.index.instructions') }}</span>

        <ol class="mt-2">
          <li v-for="(displayItem, index) in displayInstructions" class="flex gap-4">
            <div class="flex flex-col items-center shrink-0">
              <div class="cursor-pointer" @click="toggleStepCompletion(index)" role="checkbox"
                :aria-checked="completedSteps.has(index)" :aria-label="`${t('pages.recipe.id.index.step')} ${index + 1}`">
                <svg v-if="!completedSteps.has(index)" class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <svg v-else class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" fill="none" />
                </svg>
              </div>
              <div class="w-1 flex-1 my-1 bg-theme-secondary rounded"></div>
            </div>
            <div class="flex-1 pb-2 pt-1">
              <div class="flex items-center justify-between">
                <span class="font-semibold">{{ t('pages.recipe.id.index.step') }} {{ index + 1 }}</span>
                <span class="text-sm text-gray-500 whitespace-nowrap">{{ parseTime(displayItem.startTime) }}</span>
              </div>
              <div class="cursor-pointer py-2" v-html="displayItem.text" @click="showInstructionDetails(displayItem)"></div>
            </div>
          </li>

          <li class="flex gap-4">
            <div class="flex flex-col items-center shrink-0">
              <svg class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div class="flex-1 pt-1 flex items-center justify-between">
              <span>{{ t('pages.recipe.id.index.enjoy') }}</span>
              <span class="text-sm text-gray-500 whitespace-nowrap">{{ parseTime(finishTime) }}</span>
            </div>
          </li>
        </ol>

        <div v-if="item.hasNotes" class="mt-6 border-t border-gray-300 dark:border-gray-600 pt-4">
          <h2 class="font-semibold text-lg">{{ t("pages.recipe.id.index.notes") }}</h2>
          <div class="steps mt-2">{{ item.notes }}</div>
        </div>
      </section>
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
        class="block my-2 p-2 w-full rounded-sm bg-white text-black" />
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

<style scoped>
.wide-hero-image :deep(.lg\:p-4) {
  padding: 0;
}

.wide-hero-image :deep(.lg\:mr-2) {
  margin-right: 0;
}

.wide-hero-image :deep(.list-images) {
  padding-bottom: 0;
  height: 13rem;
  align-items: flex-start;
}

.wide-hero-image :deep(.list-images img) {
  height: 13rem;
  max-height: 13rem;
  width: 100%;
  object-fit: cover;
}

.wide-hero-image :deep(.youtube-player) {
  height: 13rem !important;
}

.wide-hero-image :deep(.md\:hidden) {
  display: flex !important;
}

.wide-hero-image :deep(.md\:flex),
.wide-hero-image :deep(.md\:inline-flex) {
  display: none !important;
}
</style>
