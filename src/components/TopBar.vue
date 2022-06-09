<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useState } from "../services/store";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const state = useState()!;

const canGoBack = ref(false);
const expand = ref(false);

router.afterEach((to) => {
  canGoBack.value = to.path !== "/";
});

function closeMenu() {
  expand.value = false;
}
</script>

<template>
  <div>
    <nav
      class="header fixed w-full top-0 border-gray-200 px-4 bg-theme-primary shadow shadow-slate"
    >
      <div class="flex flex-wrap justify-between sm:items-center mx-auto">
        <div class="mr-2 w-2 py-2 flex">
          <button
            class="text-white-500"
            v-if="canGoBack"
            @click="$router.back()"
          >
            <svg
              class="h-6 w-6 text-white-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="white"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
        </div>
        <div class="flex py-2">
          <router-link class="flex items-center" to="/">
            <span
              class="text-lg font-semibold whitespace-nowrap dark:text-white"
              >{{ state.title }}</span
            >
          </router-link>
        </div>
        <div class="flex py-2">
          <div class="w-8" v-for="menuOption in state.menuOptions">
            <button class="text-white-500">
              <svg
                class="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                v-html="menuOption.svg"
              ></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<style>
.header {
  padding-top: max(0.625rem, env(safe-area-inset-top));
  padding-bottom: 0.3rem;
}
</style>
