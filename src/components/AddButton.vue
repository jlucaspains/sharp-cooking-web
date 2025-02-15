<script setup lang="ts">
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";

const props = defineProps<{
    items: Array<{ name: string, text: string, action: () => void }>;
}>();
</script>

<template>
    <Menu as="div" class="p-0 w-14 h-14 fixed bottom-6 right-6">
      <div>
        <MenuButton data-testid="add-menu-button" class="
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
          <svg viewBox="0 0 20 20" enable-background="new 0 0 20 20" class="w-6 h-6 inline-block">
            <path fill="#FFFFFF" d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                C15.952,9,16,9.447,16,10z" />
          </svg>
        </MenuButton>
      </div>

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
          ">
          <div class="px-1 py-1">
            <MenuItem :key="child.name" v-for="child in props.items" v-slot="{ active }">
            <button @click="child.action" :class="[
      active ? 'bg-theme-secondary text-white' : 'text-gray-900',
      'group flex w-full items-center rounded-md px-2 py-2 text-sm',
    ]">
              {{ child.text }}
            </button>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
</template>