# GitHub Copilot Custom Instructions: Vue 3 / Vite Project

Sharp Cooking is a cookbook PWA web application created to help users maintain their own recipes locally. All data is maintained in the browser using IndexedDB with a minor API provided for importing and sharing features. The app is built with **Vue 3**, **Vite**, and **TypeScript**.

## Tech Stack
*   **Frontend:** Vue 3 (Composition API, <script setup>)
*   **Build Tool:** Vite
*   **Package Manager:** yarn
*   **Language:** TypeScript for frontend, Python (Azure Functions) for backend
*   **Styling:** Tailwind CSS is used with a theme defined in `src/index.css`. The theme colors are #2e7d32 (primary) and #60ad5e (secondary). Prefer utility-first classes over custom CSS.
*   **Routing:** Vue Router
*   **HeadlessUI:** For accessible UI components
*   **Localization:** use i18next-vue to localize all user facing text
*   **PWA Support:** Vite PWA plugin with service workers and offline support
*   **Data Management:** Browser IndexedDB via Dexie library
*   **Testing:** Playwright (e2e testing) for page functionality in `tests`, pytest for API functionality in `api/test`.
*   **Hosting:** Azure Static Web Apps for frontend, Azure Functions for backend

## Coding Standards
*   **Naming:** Use `camelCase` for variable and function names, and `PascalCase` for component names.
*   **Quotes:** Use double quotes for strings.
*   **Indentation:** Use 2 spaces for indentation.
*   **TypeScript:** Use type hints and interfaces for clarity and type safety. Avoid using any type.
*   **File Structure:** Components are located in `src/components`, pages in `src/pages`, and utility functions in `src/helpers`.
*   **Code Style:** Favor clean, maintainable code with relevant comments.
*   **Accessibility:** Ensure a minimum of WCAG 2.1 AA level accessibility.

## Best Practices
*   **Modularity:** Structure code into modular, scoped components.
*   **Asynchronous Code:** Use `async/await` for handling promises.
*   **e2e Tests:** e2e tests are required for all frontend functionality.
*   **Unit tests:** Unit tests are required for API functionality.
*   **Generate comments:** Add comments before complex logic or functions to help Copilot provide better suggestions.

## Example File: `src/components/HelloWorld.vue`

When generating or modifying Vue components, adhere to the following structure and style:

```vue
<script setup lang="ts">
import { ref } from 'vue';

// Define component props with TypeScript interface
interface Props {
  msg: string;
}

const props = defineProps<Props>();

// Define a reactive counter
const count = ref(0);

// Function to increment the counter
const increment = () => {
  count.value++;
};
</script>

<template>
  <div class="p-4 bg-white rounded shadow">
    <h1 class="text-xl font-bold">{{ props.msg }}</h1>
    <button type="button" @click="increment()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
      Count is {{ count }}
    </button>
  </div>
</template>

<!-- only use style tag for highly customized css -->
<style scoped>
</style>
