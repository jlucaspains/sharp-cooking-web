<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { useTranslation } from "i18next-vue";
import { getSetting, saveSetting } from "../services/dataService";

const { t } = useTranslation();
const state = useState()!;

const aiChatBaseUrl = ref("");
const aiAuthorizationHeader = ref("");
const openAIModelName = ref("");

onMounted(async () => {
  state.title = t("pages.ai-options.title");

  aiChatBaseUrl.value = await getSetting("OpenAIBaseApiUrl", "");
  aiAuthorizationHeader.value = await getSetting("OpenAIAuthorizationHeader", "");
  openAIModelName.value = await getSetting("OpenAIModelName", "");
});

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
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.ai-options.aiChatBaseUrl") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.ai-options.aiChatBaseUrlDescription") }}</span>
      </div>
      <input v-model="aiChatBaseUrl" @change="updateAiChatBaseUrl" placeholder="https://api.openai.com/"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.ai-options.aiAuthorizationHeader") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.ai-options.aiAuthorizationHeaderDescription") }}</span>
      </div>
      <input v-model="aiAuthorizationHeader" @change="updateAiAuthorizationHeader" placeholder="token"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.ai-options.aiModelName") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.ai-options.aiModelNameDescription") }}</span>
      </div>
      <input v-model="openAIModelName" @change="updateOpenAIModelName" placeholder="Model Name"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>
  </div>
</template>