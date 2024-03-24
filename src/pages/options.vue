<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useState } from "../services/store";
import { saveSetting, getSetting, prepareBackup } from "../services/dataService";
import Modal from "../components/Modal.vue";
import { fileSave } from "browser-fs-access";
import { useTranslation } from "i18next-vue";
import { humanFileSize } from "../helpers/storageHelper";

const { t, i18next } = useTranslation();

const state = useState()!;
const router = useRouter()!;
const version = ref("");
const useFractions = ref(false);
const enableAdvancedSearch = ref(false);
const enableYoutubeVideos = ref(false);
const enableCloudShare = ref(false);
const enableNutritionFacts = ref(false);
const stepsInterval = ref(5);
const stepsIntervalEditing = ref(5);
const isStepsIntervalModalOpen = ref(false);
const displayLanguage = computed(() => t(`pages.options.${i18next.language}`));
const selectedLanguage = ref("");
const availableLanguages = ref(["pt-BR", "en-US"] as Array<string>);
const isLanguagesModalOpen = ref(false);
const storageDescription = ref("");

onMounted(async () => {
  state.title = t("pages.options.title");
  state.menuOptions = [];

  const stepsInvervalValue = await getSetting("StepsInterval", "5");
  const useFractionsValue = await getSetting("UseFractions", "false");
  const enableAdvancedSearchValue = await getSetting("EnableAdvancedSearch", "false");
  const enableYoutubeVideosValue = await getSetting("EnableYoutubeVideos", "false");
  const enableCloudShareValue = await getSetting("EnableCloudShare", "false");
  const enableNutritionFactsValue = await getSetting("EnableNutritionFacts", "false");

  stepsInterval.value = parseInt(stepsInvervalValue);
  useFractions.value = useFractionsValue === "true";
  enableAdvancedSearch.value = enableAdvancedSearchValue === "true";
  enableYoutubeVideos.value = enableYoutubeVideosValue === "true";
  enableCloudShare.value = enableCloudShareValue === "true";
  enableNutritionFacts.value = enableNutritionFactsValue === "true";
  version.value = import.meta.env.VITE_APP_VERSION;
  selectedLanguage.value = i18next.language;
  storageDescription.value = await getStorageDescription(i18next.language);
});

watch(displayLanguage, async (value) => {
  // translation not used in vue template so we need to manually refresh
  state.title = t("pages.options.title");
  storageDescription.value = await getStorageDescription(i18next.language);
});

async function getStorageDescription(locale: string) {
  if (!navigator.storage || !navigator.storage.estimate) {
    return t("pages.options.storageNotTraceable");
  }

  const quota = await navigator.storage.estimate();

  if (!quota.usage || !quota.quota) {
    return t("pages.options.storageNotTraceable");
  }

  const remaining = quota.quota - quota.usage;
  return t("pages.options.storageDescription", { used: humanFileSize(quota.usage, [locale]), remaining: humanFileSize(remaining, [locale]) });
}

function reviewReleaseNotes() {
  window.open("https://github.com/jlucaspains/sharp-cooking-web/releases", "Change Log", "noopener")
}

function changeStepsInterval() {
  stepsIntervalEditing.value = stepsInterval.value;
  isStepsIntervalModalOpen.value = true;
}

async function takeBackup() {
  const backup = await prepareBackup();
  const stringBackup = JSON.stringify(backup);
  const blob = new Blob([stringBackup]);
  await fileSave(blob, { fileName: "sharp_cooking.json", mimeTypes: ["application/json"] });
}

function restoreBackup() {
  router.push("/recipe/import-backup");
}

function reviewTermsOfUse() {
  window.open("https://sharpcooking.net/termsofuse", "Terms of Use", "noopener")
}

function reviewPrivacyPolicy() {
  window.open("https://sharpcooking.net/webprivacypolicy", "Privacy Policy", "noopener")
}

function updateStepsInterval() {
  stepsInterval.value = stepsIntervalEditing.value;
  saveSetting("StepsInterval", stepsInterval.value.toString());
  isStepsIntervalModalOpen.value = false;
}

function updateUseFractions() {
  saveSetting("UseFractions", `${useFractions.value}`);
}

function updateEnableAdvancedSearch() {
  saveSetting("EnableAdvancedSearch", `${enableAdvancedSearch.value}`);
}

function updateEnableYoutubeVideos() {
  saveSetting("EnableYoutubeVideos", `${enableYoutubeVideos.value}`);
}

function updateEnableCloudShare() {
  saveSetting("EnableCloudShare", `${enableCloudShare.value}`);
}

function updateEnableNutritionFacts() {
  saveSetting("EnableNutritionFacts", `${enableNutritionFacts.value}`);
}

function showChangeLanguageModal() {
  selectedLanguage.value = i18next.language;
  isLanguagesModalOpen.value = true;
}

async function setSelectedLanguage() {
  i18next.changeLanguage(selectedLanguage.value);
  isLanguagesModalOpen.value = false;
}
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary" @click="reviewReleaseNotes">
      <span class="dark:text-white">{{ t("appName") }}</span>
      <div class="dark:text-white float-right">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.releaseNotes") }} {{ version }}</span>
      </div>
    </div>
    <div class="p-2 dark:text-white rounded cursor-pointer active:bg-theme-secondary" @click="showChangeLanguageModal">
      <label class="dark:text-white">{{ t("pages.options.language") }}</label>
      <div class="dark:text-white float-right ">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ displayLanguage }}</span>
      </div>
    </div>
    <div class="p-2 dark:text-white rounded cursor-pointer active:bg-theme-secondary" @click="changeStepsInterval">
      <label class="dark:text-white">{{ t("pages.options.stepsInterval") }}</label>
      <div class="dark:text-white float-right ">
        <button class="mr-2 align-top">{{ stepsInterval }} {{ t("pages.options.minutes") }}</button>
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.stepsIntervalDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.multiplierType") }}</span>
      <label data-testid="use-fractions-toggle" class="switch float-right align-middle">
        <input v-model="useFractions" type="checkbox" @change="updateUseFractions">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.multiplierTypeDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.enableAdvancedSearch") }}</span>
      <label data-testid="enable-advanced-search-toggle" class="switch float-right align-middle">
        <input v-model="enableAdvancedSearch" type="checkbox" @change="updateEnableAdvancedSearch">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.enableAdvancedSearchDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.enableYoutubeVideos") }}</span>
      <label data-testid="enable-youtube-videos-toggle" class="switch float-right align-middle">
        <input v-model="enableYoutubeVideos" type="checkbox" @change="updateEnableYoutubeVideos">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.enableYoutubeVideosDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.enableCloudShare") }}</span>
      <label data-testid="enable-cloud-share-toggle" class="switch float-right align-middle">
        <input v-model="enableCloudShare" type="checkbox" @change="updateEnableCloudShare">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.enableCloudShareDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.enableNutritionFacts") }}</span>
      <label data-testid="enable-nutrition-facts-toggle" class="switch float-right align-middle">
        <input v-model="enableNutritionFacts" type="checkbox" @change="updateEnableNutritionFacts">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.enableNutritionFactsDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.storageStats") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ storageDescription }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary" @click="takeBackup">
      <span class="dark:text-white">{{ t("pages.options.takeBackup") }}</span>
      <div class="dark:text-white float-right ">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.takeBackupDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary" @click="restoreBackup">
      <span class="dark:text-white">{{ t("pages.options.restoreBackup") }}</span>
      <div class="dark:text-white float-right ">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.restoreBackupDescription") }}</span>
      </div>
    </div>

    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary" @click="reviewTermsOfUse">
      <span class="dark:text-white">{{ t("pages.options.termsOfUse") }}</span>
      <div class="dark:text-white float-right ">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.termsOfUseDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary" @click="reviewPrivacyPolicy">
      <span class="dark:text-white">{{ t("pages.options.privacyPolicy") }}</span>
      <div class="dark:text-white float-right ">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.privacyPolicyDescription") }}</span>
      </div>
    </div>
    <Modal :isOpen="isStepsIntervalModalOpen" @closed="isStepsIntervalModalOpen = false"
      :title="t('pages.options.stepsIntervalQuestion')" :buttons="[
        {
          title: t('general.cancel'),
          action: () => isStepsIntervalModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: updateStepsInterval,
        },
      ]">
      <input v-model.number="stepsIntervalEditing" data-testid="steps-interval-input"
        class="block my-2 p-2 w-full rounded text-black" />
    </Modal>
    <Modal :isOpen="isLanguagesModalOpen" @closed="isLanguagesModalOpen = false"
      :title="t('pages.options.languageModalTitle')" :buttons="[
        {
          title: t('general.cancel'),
          action: () => isLanguagesModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: setSelectedLanguage,
        },
      ]">
      <div v-for="language in availableLanguages">
        <input :id="`lang_${language}`" type="radio" :value="language" v-model="selectedLanguage" />
        <label :for="`lang_${language}`" class="dark:text-white ml-2">{{ t(`pages.options.${language}`)}}</label>
      </div>
    </Modal>
  </div>
</template>

<style>
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 17px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 13px;
  width: 13px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked+.slider {
  background-color: #2196F3;
}

input:focus+.slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked+.slider:before {
  -webkit-transform: translateX(13px);
  -ms-transform: translateX(13px);
  transform: translateX(13px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 17px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>