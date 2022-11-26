<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRecipe,
  getRecipeImages,
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
import { getImpliedTimeFromString } from "../../../helpers/timeHelpers";
import { applyMultiplierToString } from "../../../helpers/multiplierHelpers";
import NoSleep from "nosleep.js";
import { fileSave } from "browser-fs-access";
import { useI18n } from "vue-i18n";

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
const isMultiplierModalOpen = ref(false);
const isTimeModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const startTime = ref("");
const newMultiplier = ref(1);
const { t } = useI18n();

const noSleep = new NoSleep();
let defaultTimeSetting = "5";

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
  setupMenuOptions();

  const recipe = (await getRecipe(id.value)) as RecipeViewModel;

  const currentTime = new Date();
  display.value = getDisplayValues(recipe, currentTime);

  defaultTimeSetting = await getSetting("StepsInterval", "5")

  if (recipe) {
    state.title = recipe.title;

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      recipe.image = allImages[0].image;
      console.log(recipe.image);
      recipe.imageAvailable = recipe.image ? true : false;
    }
    recipe.hasNotes = !!recipe.notes;

    item.value = recipe;
  }
});

function setupMenuOptions() {
  state.menuOptions = [
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
      ],
      svg: `<circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" />`,
    },
  ];
}

function getDisplayValues(
  recipe: RecipeViewModel,
  currentTime: Date
): Array<{ time: string; title: string; subItems: string[] }> {
  const result: Array<{ time: string; title: string; subItems: string[] }> = [];
  const parseTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const ingredientTitle = `${t("pages.recipe.id.index.ingredients")} (${recipe.multiplier || 1}x)`;

  result.push({
    time: parseTime(currentTime),
    title: ingredientTitle,
    subItems: recipe.ingredients.map((ingredient) =>
      applyMultiplierToString(
        ingredient,
        recipe.multiplier,
        false,
        /^(?<CompositeFraction>\d{1,5} \d{1,5}\/\d{1,5})|(?<Fraction>\d{1,5}\/\d{1,5})|^(?<Regular>\d{1,5}\.?\d{0,5})/
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

    // TODO: move regex to translated resource
    const impliedTime = getImpliedTimeFromString(
      step,
      /(?<Minutes>\d{1,5}\.?\d{0,5})\s*(minutes|minute|min)\b|(?<Hours>\d{1,5}\.?\d{0,5})\s*(hours|hour)\b|(?<Days>\d{1,5}\.?\d{0,5})\s*(days|day)\b/
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
  display.value = getDisplayValues(item.value, currentTime);

  isMultiplierModalOpen.value = false;
  
  const recipe = JSON.parse(JSON.stringify(item.value));
  await saveRecipe(recipe);
}

function printItem() {
  window.print();
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
  const month = currentTime.getMonth().toString().padStart(2, "0");
  const date = currentTime.getDate().toString().padStart(2, "0");

  const newDate = new Date(`${year}-${month}-${date}T${startTime.value}`);

  display.value = getDisplayValues(item.value, newDate);

  isTimeModalOpen.value = false;
}

function openImage() {
  router.push(`/recipe/${id.value}/gallery`);
}

function shareAsText() {
  if (navigator.share) {
    navigator
      .share({
        title: item.value.title,
        text: asText(item.value), 
      })
      .catch((error) => console.log("Error sharing", error));
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

function asText(item: RecipeViewModel) {
  return `${item.title}

${t("pages.recipe.id.index.ingredients")}:
${item.ingredients.join("\r\n")}

${t("pages.recipe.id.index.instructions")}:
${item.steps.join("\r\n")}`;
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
</script>

<template>
  <div>
    <h1 class="print-only text-lg font-semibold whitespace-nowrap">
      {{ item.title }}
    </h1>
    <div class="rounded-lg grid place-items-center w-full h-60 md:h-full overflow-hidden" @click="openImage"
      v-if="item.imageAvailable">
      <img alt="Recipe Image" :src="item.image" class="rounded-lg object-contain" />
    </div>
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
          bg-theme-primary
          rounded-full
          hover:bg-theme-secondary
          focus:ring-4 focus:ring-theme-primary focus:outline-none
          shadow-lg
        " @click="editItem">
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
          bg-theme-primary
          rounded-full
          hover:bg-theme-secondary
          focus:ring-4 focus:ring-theme-primary focus:outline-none
          shadow-lg
        " @click="toggleScreenLight">
        <svg class="h-5 w-5 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>
      <button class="
          w-12
          h-12
          m-1
          p-0
          bg-theme-primary
          rounded-full
          hover:bg-theme-secondary
          focus:ring-4 focus:ring-theme-primary focus:outline-none
          shadow-lg
        " @click="changeMultiplier">
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
          bg-theme-primary
          rounded-full
          hover:bg-theme-secondary
          focus:ring-4 focus:ring-theme-primary focus:outline-none
          shadow-lg
        " @click="changeTime">
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
          bg-theme-primary
          rounded-full
          hover:bg-theme-secondary
          focus:ring-4 focus:ring-theme-primary focus:outline-none
          shadow-lg
        " @click="printItem">
        <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" />
          <path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" />
          <rect x="7" y="13" width="10" height="8" rx="2" />
        </svg>
      </button>
    </div>
    <div class="grid grid-cols-12 w-full mt-7">
      <template v-for="displayItem in display">
        <div class="lg:col-span-1 sm:col-span-2 col-span-3 mt-3">
          {{ displayItem.time }}
        </div>
        <div class="-ml-3.5 mt-3">
          <svg class="h-8 w-8 text-theme-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div class="lg:col-span-10 sm:col-span-9 col-span-8 mt-3">
          {{ displayItem.title }}
        </div>
        <template v-for="subItem in displayItem.subItems">
          <div class="lg:col-span-1 sm:col-span-2 col-span-3"></div>
          <div class="border-l-4 border-theme-secondary"></div>
          <div class="lg:col-span-10 sm:col-span-9 col-span-8">
            {{ subItem }}
          </div>
        </template>
      </template>
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
      <input @keyup.enter="applyMultiplier" type="number" v-model="newMultiplier"
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
      <TimePicker @keyup.enter="setDisplayTime" v-model="startTime"></TimePicker>
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
  </div>
</template>

<style>
ul li {
  border-color: white;
}
</style>