<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useState } from "../services/store";
import { saveSetting, getSetting } from "../services/dataService";
import { useTranslation } from "i18next-vue";
import ConfigSwitch from "../components/ConfigSwitch.vue";

const { t } = useTranslation();

const state = useState()!;
const router = useRouter()!;
const enableAiChat = ref(false);
const aiChatBaseUrl = ref("");
const aiAuthorizationHeader = ref("");
const openAIModelName = ref("");
const editInSingleTextArea = ref(false);
const enableCategoryDisplay = ref(false);

onMounted(async () => {
  state.title = t("pages.preview-features.title");
  state.menuOptions = [];

  const enableAiChatValue = await getSetting("EnableAiChat", "false");
  const editInSingleTextAreaValue = await getSetting("EditInSingleTextArea", "false");
  const enableCategoryDisplayValue = await getSetting("EnableCategoryDisplay", "false");

  aiChatBaseUrl.value = await getSetting("OpenAIBaseApiUrl", "");
  aiAuthorizationHeader.value = await getSetting("OpenAIAuthorizationHeader", "");
  enableAiChat.value = enableAiChatValue === "true";
  editInSingleTextArea.value = editInSingleTextAreaValue === "true";
  enableCategoryDisplay.value = enableCategoryDisplayValue === "true";
});

function updateEnableAiChat() {
  saveSetting("EnableAiChat", `${enableAiChat.value}`);
}

function updateAiChatBaseUrl() {
  saveSetting("OpenAIBaseApiUrl", `${aiChatBaseUrl.value}`);
}

function updateAiAuthorizationHeader() {
  saveSetting("OpenAIAuthorizationHeader", `${aiAuthorizationHeader.value}`);
}

function updateOpenAIModelName() {
  saveSetting("OpenAIModelName", `${openAIModelName.value}`);
}

function updateEditInSingleTextArea() {
  saveSetting("EditInSingleTextArea", `${editInSingleTextArea.value}`);
}

function updateEnableCategoriesDisplay() {
  saveSetting("EnableCategoryDisplay", `${enableCategoryDisplay.value}`);
}

function goToCategoriesSetup() {
  router.push("/categories");
}
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="editInSingleTextArea" @change="updateEditInSingleTextArea"
        :display-name="t('pages.preview-features.editInSingleTextArea')"
        :display-description="t('pages.preview-features.editInSingleTextAreaDescription')"
        test-id="edit-in-single-text-area-toggle"></config-switch>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="enableCategoryDisplay" @change="updateEnableCategoriesDisplay"
        :display-name="t('pages.preview-features.enableCategoryDisplay')"
        :display-description="t('pages.preview-features.enableCategoryDisplayDescription')"
        test-id="enable-category-toggle"></config-switch>
    </div>
    <div class="p-2 dark:text-white rounded-sm cursor-pointer active:bg-theme-secondary" @click="goToCategoriesSetup">
      <label class="dark:text-white">{{ t("pages.preview-features.categories") }}</label>
      <div class="dark:text-white float-right ">
        <button data-testid="change-lang-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.categoriesDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="enableAiChat" @change="updateEnableAiChat"
        :display-name="t('pages.preview-features.enableAiChat')"
        :display-description="t('pages.preview-features.enableAiChatDescription')"
        test-id="enable-ai-chat-toggle"></config-switch>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.aiChatBaseUrl") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.aiChatBaseUrlDescription") }}</span>
      </div>
      <input v-model="aiChatBaseUrl" @change="updateAiChatBaseUrl" placeholder="https://api.openai.com/"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.aiAuthorizationHeader") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.aiAuthorizationHeaderDescription") }}</span>
      </div>
      <input v-model="aiAuthorizationHeader" @change="updateAiAuthorizationHeader" placeholder="Bearer token"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.aiModelName") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.aiModelNameDescription") }}</span>
      </div>
      <input v-model="openAIModelName" @change="updateOpenAIModelName" placeholder="Model Name"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>
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
