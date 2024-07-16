<script setup lang="ts">
import { onMounted } from "vue";
import TopBar from "./components/TopBar.vue";
import { useState } from "./services/store";
import Notification from "./components/Notification.vue";
import InstallPrompt from "./components/InstallPrompt.vue";
import { i18nextPromise } from './i18n';
import i18next from "i18next";

const state = useState()!;

await i18nextPromise;

onMounted(async () => {
  await i18nextPromise;
  document.body.classList.add("dark:bg-theme-gray");
  document.documentElement.lang = i18next.resolvedLanguage ?? "en";
  window.history.scrollRestoration = "manual"
});
</script>

<template>
  <TopBar />
  <div :class="{ 'container mx-auto': state.useContainer }">
    <InstallPrompt />
    <div class="mt-16 mx-4 mb-10 dark:text-white">
      <router-view v-slot="{ Component }">
        <transition mode="out-in">
            <component :is="Component"></component>
          </transition>
      </router-view>
    </div>
  </div>
  <Notification />
</template>

<style>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>