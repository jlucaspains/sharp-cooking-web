<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useState } from "../services/store";
import { saveSetting, getSetting, prepareBackup } from "../services/dataService";
import Modal from "../components/Modal.vue";
import { fileSave } from "browser-fs-access";
import { useTranslation } from "i18next-vue";
import { humanFileSize } from "../helpers/storageHelper";
import ConfigSwitch from "../components/ConfigSwitch.vue";

const { t, i18next } = useTranslation();

const state = useState()!;
const router = useRouter()!;
const version = ref("");
const useFractions = ref(false);
const stepsInterval = ref(5);
const stepsIntervalEditing = ref(5);
const isStepsIntervalModalOpen = ref(false);
const displayLanguage = computed(() => t(`pages.options.${i18next.language}`));
const selectedLanguage = ref("");
const availableLanguages = ref(["pt-BR", "en-US"] as Array<string>);
const isLanguagesModalOpen = ref(false);
const storageDescription = ref("");
const categoriesEnabled = ref(false);
const enableAiChat = ref(false);
const editInSingleTextArea = ref(false);

onMounted(async () => {
  state.title = t("pages.options.title");
  state.menuOptions = [];

  const stepsInvervalValue = await getSetting("StepsInterval", "5");
  const useFractionsValue = await getSetting("UseFractions", "false");
  const enableCategories = await getSetting("EnableCategoryDisplay", "false");
  const enableAiChatValue = await getSetting("EnableAiChat", "false");
  const editInSingleTextAreaValue = await getSetting("EditInSingleTextArea", "false");

  stepsInterval.value = parseInt(stepsInvervalValue);
  useFractions.value = useFractionsValue === "true";
  version.value = import.meta.env.VITE_APP_VERSION;
  selectedLanguage.value = i18next.language;
  storageDescription.value = await getStorageDescription(i18next.language);
  categoriesEnabled.value = enableCategories === "true";
  enableAiChat.value = enableAiChatValue === "true";
  editInSingleTextArea.value = editInSingleTextAreaValue === "true";
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
  window.open("https://sharpcookingdocs.lpains.net/termsofuse", "Terms of Use", "noopener")
}

function reviewPrivacyPolicy() {
  window.open("https://sharpcookingdocs.lpains.net/webprivacypolicy", "Privacy Policy", "noopener")
}

function updateStepsInterval() {
  stepsInterval.value = stepsIntervalEditing.value;
  saveSetting("StepsInterval", stepsInterval.value.toString());
  isStepsIntervalModalOpen.value = false;
}

function updateUseFractions() {
  saveSetting("UseFractions", `${useFractions.value}`);
}

function updateEditInSingleTextArea() {
  saveSetting("EditInSingleTextArea", `${editInSingleTextArea.value}`);
}

function updateEnableCategoryDisplay() {
  saveSetting("EnableCategoryDisplay", `${categoriesEnabled.value}`);
}

function showChangeLanguageModal() {
  selectedLanguage.value = i18next.language;
  isLanguagesModalOpen.value = true;
}

async function setSelectedLanguage() {
  i18next.changeLanguage(selectedLanguage.value);
  isLanguagesModalOpen.value = false;
}

function goToPreviewFeatures() {
  router.push("/preview-features");
}

function goToCategoriesSetup() {
  router.push("/categories");
}

function goToAIOptions() {
  router.push("/ai-options");
}
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="reviewReleaseNotes">
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
    <div class="p-2 dark:text-white rounded-sm cursor-pointer active:bg-theme-secondary" @click="showChangeLanguageModal">
      <label class="dark:text-white">{{ t("pages.options.language") }}</label>
      <div class="dark:text-white float-right ">
        <button data-testid="change-lang-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ displayLanguage }}</span>
      </div>
    </div>
    <div class="p-2 dark:text-white rounded-sm cursor-pointer active:bg-theme-secondary" @click="changeStepsInterval">
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
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="useFractions" @change="updateUseFractions"
        :display-name="t('pages.options.multiplierType')"
        :display-description="t('pages.options.multiplierTypeDescription')"
        test-id="use-fractions-toggle"></config-switch>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="editInSingleTextArea" @change="updateEditInSingleTextArea"
        :display-name="t('pages.options.editInSingleTextArea')"
        :display-description="t('pages.options.editInSingleTextAreaDescription')"
        test-id="edit-in-single-text-area-toggle"></config-switch>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="categoriesEnabled" @change="updateEnableCategoryDisplay"
        :display-name="t('pages.options.enableCategoryDisplay')"
        :display-description="t('pages.options.enableCategoryDisplayDescription')"
        test-id="enable-category-toggle"></config-switch>
    </div>
    <div v-if="categoriesEnabled" class="p-2 dark:text-white rounded-sm cursor-pointer active:bg-theme-secondary" @click="goToCategoriesSetup">
      <label class="dark:text-white">{{ t("pages.preview-features.categories") }}</label>
      <div class="dark:text-white float-right ">
        <button data-testid="categories-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.categoriesDescription") }}</span>
      </div>
    </div>
    <div v-if="enableAiChat" class="p-2 dark:text-white rounded-sm cursor-pointer active:bg-theme-secondary" @click="goToAIOptions">
      <label class="dark:text-white">{{ t("pages.options.aiOptions") }}</label>
      <div class="dark:text-white float-right ">
        <button data-testid="ai-options-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.aiOptionsDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.options.storageStats") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ storageDescription }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="goToPreviewFeatures">
      <span class="dark:text-white">{{ t("pages.options.previewFeatures") }}</span>
      <div class="dark:text-white float-right ">
        <button><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
            fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.options.previewFeaturesDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="takeBackup">
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
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="restoreBackup">
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

    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="reviewTermsOfUse">
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
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="reviewPrivacyPolicy">
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
        class="block my-2 p-2 w-full rounded-sm bg-white text-black" />
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
        <label :for="`lang_${language}`" class="dark:text-white ml-2">{{ t(`pages.options.${language}`) }}</label>
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
