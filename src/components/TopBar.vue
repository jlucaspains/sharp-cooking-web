<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useState } from "../services/store";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const router = useRouter();
const state = useState()!;

const canGoBack = ref(false);

router.afterEach((to) => {
  canGoBack.value = to.path !== "/";
});

function goBack() {
  if (router.currentRoute.value.query?.fromShortcut == "1") {
    router.replace("/");
  } else {
    router.back();
  }
}
</script>

<template>
  <div class="no-print">
    <nav class="
        header
        fixed
        w-full
        top-0
        border-gray-200
        px-4
        bg-theme-primary
        shadow shadow-slate
      ">
      <div class="flex justify-between sm:items-center mx-auto">
        <div class="flex">
          <transition name="back">
            <button class="
              p-2
              inline-flex
              w-full
              justify-center
              rounded-md
              text-sm
              font-medium
              text-white
              hover:bg-theme-secondary/30
              focus:outline-hidden
              focus-visible:ring-2
              focus-visible:ring-white
              focus-visible:ring-opacity-75
            " v-show="canGoBack" @click="goBack()">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="white">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </transition>
        </div>
        <div class="flex w-full truncate">
          <router-link class="items-center py-2" to="/">
            <span class="text-lg font-semibold whitespace-nowrap text-white">{{ state.title }}</span>
          </router-link>
        </div>
        <div class="flex">
          <template v-for="menuOption in state.menuOptions">
            <Menu v-if="menuOption.children && menuOption.children.length > 0" as="div"
              class="w-8 relative inline-block text-left">
              <div>
                <MenuButton data-testid="topbar-options" class="py-2
                    inline-flex
                    w-full
                    justify-center
                    rounded-md
                    text-sm
                    font-medium
                    text-white
                    hover:bg-theme-secondary/30
                    focus:outline-hidden
                    focus-visible:ring-2
                    focus-visible:ring-white
                    focus-visible:ring-opacity-75
                  ">
                  <svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" v-html="menuOption.svg"></svg>
                </MenuButton>
              </div>

              <transition enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <MenuItems class="
                    absolute
                    right-0
                    mt-2
                    w-56
                    origin-top-right
                    divide-y divide-gray-100
                    rounded-md
                    bg-white
                    shadow-lg
                    ring-1 ring-black ring-opacity-5
                    focus:outline-hidden
                  ">
                  <div class="px-1 py-1">
                    <MenuItem v-slot="{ active }" v-for="child in menuOption.children">
                    <button @click="child.action" :class="[
              active
                ? 'bg-theme-secondary text-white'
                : 'text-gray-900',
              'group flex w-full items-center rounded-md px-2 py-2 text-sm',
            ]">
                      <svg v-if="child.svg" class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        v-html="child.svg"></svg>
                      {{ child.text }}
                    </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
            <button v-else data-testid="topbar-single-button" class="p-2
                inline-flex
                w-full
                justify-center
                rounded-md
                text-sm
                font-medium
                text-white
                hover:bg-theme-secondary/30
                focus:outline-hidden
                focus-visible:ring-2
                focus-visible:ring-white
                focus-visible:ring-opacity-75
              " @click="menuOption.action">
              <svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round" v-html="menuOption.svg"></svg>
            </button>
          </template>
        </div>
      </div>
    </nav>
  </div>
</template>

<style>
.header {
  padding-top: max(0.625rem, env(safe-area-inset-top));
  padding-bottom: 0.3rem;
  z-index: 1;
}

.back-enter-active {
  animation: back-in 0.2s;
}

.back-leave-active {
  animation: back-out 0.2s;
}

@keyframes back-in {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.25);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes back-out {
  0% {
    transform: translate(0);
  }

  50% {
    transform: translate(-20px);
  }

  100% {
    transform: translate(-50px);
  }
}
</style>
