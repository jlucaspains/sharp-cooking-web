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
      <div
        class="container flex flex-wrap justify-between sm:items-center mx-auto"
      >
        <div class="flex">
          <button
            class="text-white-500 mr-2 md:hidden"
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
          <router-link class="flex items-center" to="/">
            <span
              class="text-lg font-semibold whitespace-nowrap dark:text-white"
              >{{ state.title }}</span
            >
          </router-link>
        </div>
        <button
          @click.prevent="expand = !expand"
          type="button"
          class="inline-flex items-center p-2 ml-3 text-sm text-white rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="mobile-menu"
          aria-expanded="false"
        >
          <span class="sr-only">{{ t("topBar.openMainMenu") }}</span>
          <svg
            class="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <svg
            class="hidden w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
        <!-- <input
          type="text"
          :placeholder="t('topBar.search')"
          class="mx-4 hidden md:block p-2 rounded text-black"
        /> -->
        <div
          :class="[expand ? '' : 'hidden', 'w-full md:block md:w-auto']"
          id="mobile-menu"
        >
          <ul
            class="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium"
          >
            <li>
              <router-link
                @click.native="closeMenu"
                class="block py-2 pr-4 pl-3 text-white border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                to="/"
                >{{ t("topBar.home") }}</router-link
              >
            </li>

            <li>
              <router-link
                @click.native="closeMenu"
                class="block py-2 pr-4 pl-3 text-white border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                to="/options"
                >{{ t("topBar.options") }}</router-link
              >
            </li>
          </ul>
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
