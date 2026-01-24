<script setup lang="ts">
import { onMounted } from "vue";
import { useTranslation } from "i18next-vue";
import { useState } from "../services/store";

const { t } = useTranslation();
const state = useState()!;

onMounted(async () => {
  state.title = "Export Recipe Book";
  state.menuOptions = [];
});
</script>

<template>
  <div class="bg-white text-slate-900 dark:bg-theme-gray dark:text-white min-h-screen p-4">
    <h1 class="text-2xl font-bold mb-4">Export Recipe Book</h1>
    <p>Export functionality coming soon...</p>
  </div>
</template>
