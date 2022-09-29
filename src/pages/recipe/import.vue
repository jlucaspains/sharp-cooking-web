<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useState } from "../../services/store";
import { notify } from "notiwind";
import * as cheerio from 'cheerio';

const route = useRoute();
const router = useRouter();

const state = useState()!;

const urlText = ref("");

onMounted(() => {
  state.title = "Import";
});

async function importRecipe() {
  const result = await fetch(urlText.value, {
  mode: 'no-cors'
});
  const html = await result.text();
  console.log(html);
  const dom = cheerio.load(html);
  const items = dom("script[type='application/ld+json']");

  console.log(items.length);
}
</script>

<template>
  <div class="mt-16 mx-4 dark:text-white">
    <div class="flex flex-col mb-2">
      <input
        type="text"
        placeholder="URL"
        v-model="urlText"
        class="p-2 my-2 rounded text-black"
      />
      <button
        @click="importRecipe"
        class="
          p-2
          inline-flex
          w-full
          justify-center
          rounded-md
          text-sm
          font-medium
          text-white
          hover:bg-theme-secondary hover:bg-opacity-30
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-white
          focus-visible:ring-opacity-75
        "
      >
        GO
      </button>
      <!-- <iframe height="1000" width="100%" :src="urlText" /> -->
    </div>
  </div>
</template>

<style>
</style>