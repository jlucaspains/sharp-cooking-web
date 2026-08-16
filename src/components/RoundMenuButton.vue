<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

defineProps<{
  title: string;
  testId: string;
  items: Array<{ text: string; action: () => void; testId?: string; disabled?: boolean }>;
}>();
</script>

<template>
  <Menu as="div" class="inline-block relative">
    <MenuButton :title="title" :data-testid="testId" class="
        w-12
        h-12
        m-1
        rounded-full
        bg-theme-primary
        hover:bg-theme-secondary
        focus:bg-theme-secondary
        focus:shadow-lg
        shadow-md
        hover:shadow-lg
        transition duration-150 ease-in-out
      ">
      <slot />
    </MenuButton>

    <transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
      <MenuItems class="
          -top-2
          transform
          -translate-y-full
          absolute
          right-0
          w-56
          origin-top-right
          bg-white
          divide-y divide-gray-100
          rounded-md
          shadow-lg
          ring-1 ring-black ring-opacity-5
          focus:outline-hidden
          z-10
        ">
        <div class="px-1 py-1">
          <MenuItem :key="item.text" v-for="item in items" v-slot="{ active }" :disabled="item.disabled">
            <button :data-testid="item.testId" :disabled="item.disabled" @click="item.action" :class="[
              active ? 'bg-theme-secondary text-white' : 'text-gray-900',
              'group flex w-full items-center rounded-md px-2 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed',
            ]">
              {{ item.text }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
