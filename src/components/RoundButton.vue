<script setup lang="ts">

const props = defineProps<{
    title: string;
    testId: string;
}>();
</script>

<template>
    <button class="
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
          " :title="props.title" :data-testid="testId" @click="$emit('click')">
        <slot />
    </button>
</template>
