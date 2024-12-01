<script setup lang="ts">
const props = defineProps<{
    title: string;
    image: string | undefined;
    imageAvailable: boolean;
    rating: number;
}>();

const emit = defineEmits<{
    (e: "click"): void;
}>();
</script>

<template>
    <div @click="emit('click')" @keydown.enter="emit('click')" tabindex="0" class="
          p-5
          h-60
          rounded-lg
          shadow
          bg-white
          dark:bg-theme-secondary-gray
          overflow-hidden
          cursor-pointer
        ">
        <div style="height: calc(100% - 0.5rem)" class="-mx-5 -mt-5 overflow-hidden">
            <img alt="Recipe" v-if="props.imageAvailable" :src="props.image" class="object-contain" />
            <div v-else class="bg-theme-primary h-full grid place-items-center">
                <svg class="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            </div>
        </div>
        <div class="h-full pt-2">
            <div class="truncate inline-block" style="width: calc(100% - 35px)">
                <span data-testid="recipe-title" class="text-ellipsis text-black dark:text-white text-lg">{{
                    props.title
                }}</span>
            </div>
            <div class="truncate inline-block" syle="width: 30px">
                <span data-testid="recipe-score" class="text-black dark:text-white" v-show="props.rating > 0">{{
                    props.rating }}⭐</span>
            </div>
        </div>
    </div>
</template>