<script setup lang="ts">
import { onMounted } from "vue";
import TopBar from "./components/TopBar.vue";
import Notification from "./components/Notification.vue";

onMounted(async () => {
  document.body.classList.add("dark:bg-theme-gray");
});
</script>

<template>
  <TopBar />
  <div class="container mx-auto">
    <div class="mt-16 mx-4 mb-10 dark:text-white">
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
