<script setup lang="ts">
import { onMounted } from "vue";
import TopBar from "./components/TopBar.vue";
import { useI18n } from "vue-i18n";
import { initialize } from "./services/dataService";
import Notification from "./components/Notification.vue";

onMounted(async () => {
  document.body.classList.add("dark:bg-theme-gray");
  // await initialize();
});

const { t } = useI18n();
</script>

<template>
  <TopBar />
  <div class="container mx-auto">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component"></component>
      </transition>
    </router-view>
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
