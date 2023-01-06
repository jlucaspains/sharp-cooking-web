<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const localValue = ref("");

watch(
  () => props.modelValue,
  (newValue: string) => {
    localValue.value = newValue;
  }
);

onMounted(() => {
  localValue.value = props.modelValue;
});

function updateValue(event: Event) {
  if (!event.target) {
    return;
  }

  const value = (event.target as HTMLInputElement)?.value;

  emit("update:modelValue", value);
}
</script>

<template>
  <div class="w-full flex text-xl">
    <input
      data-testid="time-value-input"
      type="time"
      class="block m-2 p-2 rounded text-black"
      v-model="localValue"
      @input="updateValue"
    />
  </div>
</template>
