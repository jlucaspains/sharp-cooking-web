<script setup lang="ts">
import App from './App.vue'

document.body.classList.add("dark:bg-theme-gray");
</script>

<template>
    <Suspense>
      <template #default>
        <App />
      </template>
      <template #fallback>
        <div>
          <h1>Loading...</h1>
        </div>
      </template>
    </Suspense>
  </template>