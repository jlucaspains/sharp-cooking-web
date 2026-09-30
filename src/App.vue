<script setup lang="ts">
import { onMounted } from "vue";
import TopBar from "./components/TopBar.vue";
import { useState } from "./services/store";
import Notification from "./components/Notification.vue";
import InstallPrompt from "./components/InstallPrompt.vue";
import { i18nextPromise } from './i18n';
import i18next from "i18next";
import { autoSyncIfEnabled } from "./services/sync/syncService";
import { purgeDeletedRecords } from "./services/dataService";
import { notify } from "notiwind";

const state = useState()!;

await i18nextPromise;

// Warn once per app load - the online event can fire repeatedly on a flaky connection.
let reauthWarningShown = false;

async function autoSync() {
  const outcome = await autoSyncIfEnabled();

  if (outcome !== "reauth-required" || reauthWarningShown) {
    return;
  }

  reauthWarningShown = true;
  notify({ group: "warning", title: i18next.t("pages.cloud-sync.reauthRequiredTitle"), text: i18next.t("pages.cloud-sync.reauthRequiredText") }, 6000);
}

onMounted(async () => {
  await i18nextPromise;
  document.body.classList.add("dark:bg-theme-gray");
  document.documentElement.lang = i18next.resolvedLanguage ?? "en";
  window.history.scrollRestoration = "manual"

  await purgeDeletedRecords();

  // Do not await as it may take a while and 
  // this will block app startup
  autoSync();
  window.addEventListener("online", autoSync);
});
</script>

<template>
  <TopBar />
  <div :class="{ 'container mx-auto': state.useContainer }">
    <InstallPrompt />
    <div class="mt-16 mx-4 dark:text-white">
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