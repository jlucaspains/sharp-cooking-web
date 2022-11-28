<script setup lang="ts">
import { onMounted } from "vue";
import TopBar from "./components/TopBar.vue";
import { useState } from "./services/store";
import Notification from "./components/Notification.vue";
import { i18nextPromise } from './i18n';
import i18next from "i18next";

const state = useState()!;

onMounted(async () => {
  await i18nextPromise;
  document.body.classList.add("dark:bg-theme-gray");
  document.documentElement.lang = i18next.resolvedLanguage;
});
</script>

<template>
  <TopBar />
  <div :class="{'container mx-auto': !state.fullScreen}">
    <div :class="{'mt-16 mx-4 mb-10': !state.fullScreen, 'dark:text-white': true}">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </div>
  </div>
  <Notification />
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-active {
  opacity: 0;
}
</style>
