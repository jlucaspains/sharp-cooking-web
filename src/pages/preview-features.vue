<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useState } from "../services/store";
import { saveSetting, getSetting } from "../services/dataService";
import { useTranslation } from "i18next-vue";

const { t, i18next } = useTranslation();

const state = useState()!;
const router = useRouter()!;
const enableNutritionFacts = ref(false);
const enableRecipeLanguageSwitcher = ref(false);
const enableAiChat = ref(false);
const aiChatBaseUrl = ref("");
const aiAuthorizationHeader = ref("");
const openAIModelName = ref("");

onMounted(async () => {
  state.title = t("pages.preview-features.title");
  state.menuOptions = [];

  const enableNutritionFactsValue = await getSetting("EnableNutritionFacts", "false");
  const enableRecipeLanguageSwitcherValue = await getSetting("EnableRecipeLanguageSwitcher", "false");
  const enableAiChatValue = await getSetting("EnableAiChat", "false");
  
  aiChatBaseUrl.value = await getSetting("OpenAIBaseApiUrl", "");
  aiAuthorizationHeader.value = await getSetting("OpenAIAuthorizationHeader", "");
  enableNutritionFacts.value = enableNutritionFactsValue === "true";
  enableRecipeLanguageSwitcher.value = enableRecipeLanguageSwitcherValue === "true";
  enableAiChat.value = enableAiChatValue === "true";
});

function updateEnableNutritionFacts() {
  saveSetting("EnableNutritionFacts", `${enableNutritionFacts.value}`);
}

function updateEnableRecipeLanguageSwitcher() {
  saveSetting("EnableRecipeLanguageSwitcher", `${enableRecipeLanguageSwitcher.value}`);
}

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
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.enableNutritionFacts") }}</span>
      <label data-testid="enable-nutrition-facts-toggle" class="switch float-right align-middle">
        <input v-model="enableNutritionFacts" type="checkbox" @change="updateEnableNutritionFacts">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.enableNutritionFactsDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.enableRecipeLanguageSwitcher") }}</span>
      <label data-testid="enable-recipe-language-toggle" class="switch float-right align-middle">
        <input v-model="enableRecipeLanguageSwitcher" type="checkbox" @change="updateEnableRecipeLanguageSwitcher">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.enableRecipeLanguageSwitcherDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.enableAiChat") }}</span>
      <label data-testid="enable-ai-chat-toggle" class="switch float-right align-middle">
        <input v-model="enableAiChat" type="checkbox" @change="updateEnableAiChat">
        <span class="slider round"></span>
      </label>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.enableAiChatDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.aiChatBaseUrl") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.aiChatBaseUrlDescription") }}</span>
      </div>
      <input v-model="aiChatBaseUrl" @change="updateAiChatBaseUrl" placeholder="https://api.openai.com/" class="block p-2 w-full rounded text-black shadow-sm">
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.aiAuthorizationHeader") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.aiAuthorizationHeaderDescription") }}</span>
      </div>
      <input v-model="aiAuthorizationHeader" @change="updateAiAuthorizationHeader" placeholder="Bearer token" class="block p-2 w-full rounded text-black shadow-sm">
    </div>
    <div class="mt-4 p-2 rounded cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.preview-features.aiModelName") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.preview-features.aiModelNameDescription") }}</span>
      </div>
      <input v-model="openAIModelName" @change="updateOpenAIModelName" placeholder="Model Name" class="block p-2 w-full rounded text-black shadow-sm">
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