<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
    getRecipe,
    getRecipeImages
} from "../../../services/dataService";
import { useState } from "../../../services/store";
import { RecipeViewModel } from "../recipeViewModel";

const route = useRoute();
const router = useRouter();

const id = computed(() => parseInt(<string>route.params.id));
const state = useState()!;
const item = ref({
    id: 1,
    title: "",
    score: 3,
    ingredients: [] as string[],
    steps: [] as string[],
    notes: "",
    changedOn: "",
    image: "",
    imageAvailable: false,
} as RecipeViewModel);

onMounted(async () => {
    const recipe = <RecipeViewModel>await getRecipe(id.value);

    if (recipe) {
        state.title = recipe.title;

        const allImages = await getRecipeImages(id.value);

        if (allImages.length > 0) {
            recipe.image = allImages[0].image;
            recipe.imageAvailable = recipe.image ? true : false;
        }

        item.value = recipe;
    }

    window.setTimeout(() => {
        window.print();

        router.back();
    }, 1000);
});

</script>

<template>
    <div class="dark:text-white light:text-black">
        <h1>{{ item.title }}</h1>
        <div class="source">
            <div v-if="!!item.source">
                <span>Source: {{ item.source }}</span>
            </div>
            <div v-if="!!item.score">
                <span>Rating: {{ item.score }}</span>
                <!-- @string.Format("{0}: {1}", Resources.EditItemView_Rating, new string('⭐', Model.Rating)) -->
            </div>
        </div>
        <div>
            <div
                class="rounded-lg grid place-items-center w-1/2 overflow-hidden"
                v-if="item.imageAvailable"
            >
                <img :src="item.image" class="rounded-lg object-contain" />
            </div>
            <div
                class="bg-theme-primary rounded-lg grid place-items-center w-1/2 h-80 overflow-hidden"
                v-else
            >
                <svg
                    class="h-16 w-16 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            </div>
            <img :src="item.image" width="50%" height="auto" />
        </div>
        <div>
            <h2>Ingredients</h2>
            <ul>
                <li v-for="ingredient in item.ingredients">{{ ingredient }}</li>
            </ul>
        </div>
        <div>
            <h2>Steps</h2>
            <ol>
                <li v-for="step in item.steps">{{ step }}</li>
            </ol>
        </div>
        <div>
            <h2>Notes</h2>
            <span>{{ item.notes }}</span>
        </div>
        <footer>
            <span>https://app.sharpcooking.net</span>
        </footer>
    </div>
</template>

<style scoped>
.source {
    margin-bottom: 30px;
}

.source > div {
    display: inline-block;
    margin-right: 10px;
}

footer {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    font-size: 0.8em;
}
</style>
