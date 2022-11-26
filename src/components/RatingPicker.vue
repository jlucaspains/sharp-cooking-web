<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
    modelValue: number;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
}>();

const localValue = ref(0);

watch(
    () => props.modelValue,
    (newValue: number) => {
        localValue.value = newValue;
    }
);

onMounted(() => {
    localValue.value = props.modelValue;
});

function updateValue(value: number) {
    emit("update:modelValue", value);
}
</script>
    
<template>
    <div>
        <button @click="updateValue(1)" type="button" title="1 star" :class="modelValue < 1 ? 'gray' : ''">⭐</button>
        <button @click="updateValue(2)" type="button" title="2 stars" :class="modelValue < 2 ? 'gray' : ''">⭐</button>
        <button @click="updateValue(3)" type="button" title="3 stars" :class="modelValue < 3 ? 'gray' : ''">⭐</button>
        <button @click="updateValue(4)" type="button" title="4 stars" :class="modelValue < 4 ? 'gray' : ''">⭐</button>
        <button @click="updateValue(5)" type="button" title="5 stars" :class="modelValue < 5 ? 'gray' : ''">⭐</button>
    </div>
</template>

<style>
.gray {
    filter: grayscale(100%);
}
</style>