<script setup lang="ts">
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getRecipe,
  saveRecipe,
  saveRecipeImage,
  getRecipeImages,
  getNextRecipeId,
} from "../../../services/dataService";
import { RecipeImage } from "../../../services/recipe";
import { RecipeViewModel } from "../recipeViewModel";
import { useState } from "../../../services/store";
import { notify } from "notiwind";
import RatingPicker from "../../../components/RatingPicker.vue";
import { fileOpen, supported } from "browser-fs-access";
import Modal from "../../../components/Modal.vue";

const state = useState()!;
const route = useRoute();
const router = useRouter();

const id = computed(() => parseInt(route.params.id as string));
const query = computed(() => route.query);
const item = ref({
  id: 1,
  title: "",
  score: 3,
  ingredients: [] as string[],
  steps: [] as string[],
  notes: "",
  image: "",
  imageAvailable: false,
} as RecipeViewModel);
const images = ref([] as RecipeImage[]);
const isDirtyModalOpen = ref(false);
const isImportModalOpen = ref(false);
const importRecipeUrl = ref("");
const isImporting = ref(false);
const stepRefs = ref<HTMLInputElement[]>([]);
const ingredientRefs = ref<HTMLInputElement[]>([]);
let isDirty = false;


watch(
  item,
  (newValue: RecipeViewModel) => {
    isDirty = true;
  },
  { deep: true }
);

onMounted(async () => {
  state.menuOptions = [
    {
      text: "Save",
      action: save,
      svg: `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />  <polyline points="17 21 17 13 7 13 7 21" />  <polyline points="7 3 7 8 15 8" />`,
    },
  ];

  if (query.value.import == "1") {
    isImportModalOpen.value = true;
  }

  let recipe: RecipeViewModel;
  if (id.value === 0) {
    recipe = new RecipeViewModel();
    recipe.title = "";
    recipe.steps.push("");
    recipe.ingredients.push("");
  } else {
    recipe = (await getRecipe(id.value)) as RecipeViewModel;
  }

  if (recipe) {
    state.title = recipe.title || "New Recipe";

    const allImages = await getRecipeImages(id.value);

    if (allImages.length > 0) {
      images.value = allImages;

      recipe.image = allImages[0].image;
      recipe.imageAvailable = recipe.image ? true : false;
    }

    item.value = recipe;
    nextTick(() => {
      isDirty = false;
    });
  }
});

router.beforeEach(async (to, from) => {
  if (isDirty) {
    isDirtyModalOpen.value = true;
    return false;
  }

  return true;
});

async function isDirtyModalClose(shouldSave: boolean) {
  if (shouldSave) {
    await save();
  }

  isDirtyModalOpen.value = false;
  isDirty = false;

  router.back();
}

async function save() {
  const isNew = !item.value.id;
  if (isNew) {
    item.value.id = await getNextRecipeId();
  }

  // remove proxy stuff
  const recipe = JSON.parse(JSON.stringify(item.value));
  await saveRecipe(recipe);

  if (item.value.image) {
    await saveRecipeImage(new RecipeImage(recipe.id, item.value.image));
  }

  if (isNew) {
    router.replace(`/recipe/${item.value.id}/edit`);
  }

  isDirty = false;

  state.title = recipe.title;

  notify(
    {
      group: "success",
      title: "Success",
      text: "Saved successfully!",
    },
    2000
  );
}

async function pickImage() {
  if (supported) {
    console.log("Using the File System Access API.");
  } else {
    console.log("Using the fallback implementation.");
  }

  // Open a file.
  const imagePicked = await fileOpen({
    mimeTypes: ["image/*"],
  });

  item.value.image = await getBase64(imagePicked);
  item.value.imageAvailable = !!item.value.image;
}

async function fileSelected(selectedFiles: FileList | null) {
  if (selectedFiles && selectedFiles.length > 0) {
    item.value.image = await getBase64(selectedFiles[0]);
    item.value.imageAvailable = !!item.value.image;
  }
}

function getBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function addIngredientAt(index: number) {
  item.value.ingredients.splice(index + 1, 0, "");
  nextTick(() => {
    ingredientRefs.value[index + 1].focus();
  });
}

function addStepAt(index: number) {
  item.value.steps.splice(index + 1, 0, "");
  nextTick(() => {
    stepRefs.value[index + 1].focus();
  });
}

async function importRecipe() {
  let success = true;
  try {
    isImporting.value = true;
    const result = await fetch("https://sharpcookingapi.azurewebsites.net/recipe/parse", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: `{"url": "${importRecipeUrl.value}", "downloadImage": true}`
    });


    success = result.ok; 
    if (!result.ok) {
      
    }

    const html = await result.json();
    item.value.title = html.title;
    item.value.score = 5;
    item.value.ingredients = html.ingredients.map((x: any) => x.raw);
    item.value.steps = html.instructions.map((x: any) => x.raw);
    item.value.image = html.image;
    item.value.imageAvailable = !!item.value.image
  }
  catch {
    success = false;
  }
  finally {
    isImportModalOpen.value = false;
    isImporting.value = false;

    notify(
        {
          group: success ? "success" : "error",
          title: success ? "Done" : "Error",
          text: success ? "Imported successfully" : "This recipe could not be imported",
        },
        2000
      );
  }
}
</script>

<template>
  <div class="mt-16 mx-4 mb-10 dark:text-white">
    <div @click="pickImage">
      <div class="rounded-lg grid place-items-center w-full h-80 overflow-hidden" v-if="item.imageAvailable">
        <img alt="Recipe Image" :src="item.image" class="rounded-lg object-contain" />
      </div>
      <div class="
          bg-theme-primary
          rounded-lg
          grid
          place-items-center
          w-full
          h-80
          overflow-hidden
        " v-else>
        <svg class="h-16 w-16 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    </div>
    <label for="title">Title</label>
    <input id="title" type="text" v-model="item.title" class="block p-2 w-full rounded text-black shadow-sm" />
    <label>Rating</label>
    <RatingPicker class="mb-2" v-model="item.score" />
    <label>Ingredients</label>
    <button class="ml-2 align-middle" type="button" title="Add Ingredient"
      @click="addIngredientAt(item.ingredients.length - 1)">
      <svg class="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
    <div class="flex my-3 w-full" v-for="(ingredient, index) in item.ingredients">
      <input type="text" placeholder="1 cup flour" v-model="item.ingredients[index]"
        @keyup.enter="addIngredientAt(index)" ref="ingredientRefs"
        class="block p-2 rounded flex-auto text-black shadow-sm" />
      <button type="button" class="ml-2 align-middle" title="Delete Ingredient"
        @click="item.ingredients.splice(index, 1)">
        <svg class="h-4 w-4 text-black dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    </div>
    <label>Steps</label>
    <button class="ml-2" type="button" title="Add Step" @click="addStepAt(item.steps.length - 1)">
      <svg class="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
    <div class="flex my-3 w-full" v-for="(step, index) in item.steps">
      <input type="text" placeholder="Preheat oven to 350 F" v-model="item.steps[index]"
        class="block p-2 flex-auto rounded text-black shadow-sm" ref="stepRefs" @keyup.enter="addStepAt(index)" />
      <button type="button" class="ml-2" title="Delete Step" @click="item.steps.splice(index, 1)">
        <svg class="h-4 w-4 text-black dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
          stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" />
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    </div>
    <label for="notes">Notes</label>
    <textarea id="notes" v-model="item.notes" class="
        block
        p-2
        flex-auto
        w-full
        h-20
        bg-white
        rounded
        text-base text-black
      " />
    <Modal :isOpen="isDirtyModalOpen" @closed="isDirtyModalOpen = false" title="Save?" :buttons="[
      {
        title: 'Yes',
        action: () => isDirtyModalClose(true),
      },
      {
        title: 'No',
        action: () => isDirtyModalClose(false),
      },
    ]">
      <span class="dark:text-white">Would you like to save your changes first?</span>
    </Modal>
    <Modal :isOpen="isImportModalOpen" @closed="isImportModalOpen = false" title="Please provide recipe URL" :buttons="[
      {
        title: 'OK',
        action: importRecipe,
      },
      {
        title: 'Cancel',
        action: () => isImportModalOpen = false,
      },
    ]">
      <span class="dark:text-white" v-if="isImporting">Loading recipe. This may take up to a minute.</span>
      <input :disabled="isImporting" v-model="importRecipeUrl" class="block my-2 p-2 w-full rounded text-black" />
    </Modal>
  </div>
</template>
