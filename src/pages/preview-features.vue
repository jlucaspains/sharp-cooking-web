<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { saveSetting, getSetting } from "../services/dataService";
import { useTranslation } from "i18next-vue";
import ConfigSwitch from "../components/ConfigSwitch.vue";

const { t } = useTranslation();

const state = useState()!;
const enableAiChat = ref(false);
const enableCompactMobileTimeline = ref(false);

onMounted(async () => {
  state.title = t("pages.preview-features.title");
  state.menuOptions = [];

  const enableAiChatValue = await getSetting("EnableAiChat", "false");
  const enableCompactMobileTimelineValue = await getSetting("EnableCompactMobileTimeline", "false");

  enableAiChat.value = enableAiChatValue === "true";
  enableCompactMobileTimeline.value = enableCompactMobileTimelineValue === "true";
});

function updateEnableAiChat() {
  saveSetting("EnableAiChat", `${enableAiChat.value}`);
}

function updateEnableCompactMobileTimeline() {
  saveSetting("EnableCompactMobileTimeline", `${enableCompactMobileTimeline.value}`);
}
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="enableAiChat" @change="updateEnableAiChat"
        :display-name="t('pages.preview-features.enableAiChat')"
        :display-description="t('pages.preview-features.enableAiChatDescription')"
        test-id="enable-ai-chat-toggle"></config-switch>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <config-switch v-model="enableCompactMobileTimeline" @change="updateEnableCompactMobileTimeline"
        :display-name="t('pages.preview-features.enableCompactMobileTimeline')"
        :display-description="t('pages.preview-features.enableCompactMobileTimelineDescription')"
        test-id="enable-compact-mobile-timeline-toggle"></config-switch>
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
