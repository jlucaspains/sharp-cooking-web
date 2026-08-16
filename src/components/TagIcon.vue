<script setup lang="ts">
import { computed } from "vue";
import { useTranslation } from "i18next-vue";
import { DIET_TAGS } from "../services/dietTags";

const props = defineProps<{
  tagId: string;
}>();

const { t } = useTranslation();

const label = computed(() => {
  const tag = DIET_TAGS.find(t => t.id === props.tagId);
  return tag ? t(tag.labelKey) : props.tagId;
});
</script>

<template>
  <span :title="label" class="inline-flex items-center justify-center w-6 h-6" role="img" :aria-label="label">
    <svg v-if="tagId === 'gluten-free'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="12" y1="6" x2="9" y2="4" />
      <line x1="12" y1="6" x2="15" y2="4" />
      <line x1="12" y1="10" x2="9" y2="8" />
      <line x1="12" y1="10" x2="15" y2="8" />
      <line x1="12" y1="14" x2="9" y2="12" />
      <line x1="12" y1="14" x2="15" y2="12" />
      <line x1="3" y1="21" x2="21" y2="3" />
    </svg>
    <svg v-else-if="tagId === 'low-fodmap'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <path d="M8 3c-2 2-3 4-3 7a7 7 0 0 0 14 0c0-3-1-5-3-7" />
      <path d="M9 12l2 2 4-4" />
    </svg>
    <svg v-else-if="tagId === 'vegetarian'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <path d="M20 4C11 4 4 11 4 20c9 0 16-7 16-16z" />
      <path d="M6 18C10 14 14 10 20 4" />
    </svg>
    <svg v-else-if="tagId === 'vegan'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <line x1="12" y1="21" x2="12" y2="10" />
      <path d="M12 10C12 6 9 4 5 4c0 4 3 7 7 7z" />
      <path d="M12 13C12 9 15 7 19 7c0 4-3 7-7 7z" />
    </svg>
    <svg v-else-if="tagId === 'dairy-free'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
      <path d="M9 3h6l1 3-1 15H9L8 6z" />
      <line x1="8.5" y1="9" x2="15.5" y2="9" />
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>
