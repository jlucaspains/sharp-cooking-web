<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue"): void;
}>();

const localValue = ref("");

function updateValue(event) {
  emit("update:modelValue", event.target.value);
}
</script>

<template>
  <div class="w-full flex text-xl">
    <input type="time" class="block m-2 p-2 rounded text-black" v-model="localValue" @input="updateValue" />
  </div>
</template>
