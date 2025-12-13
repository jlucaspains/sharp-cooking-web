<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../../services/store";
import { fileOpen } from "browser-fs-access";
import { notify } from "../../services/notificationService";
import { Recipe } from "../../services/recipe";
import { useTranslation } from "i18next-vue";
import BusyIndicator from "../../components/BusyIndicator.vue";
import Modal from "../../components/Modal.vue";
import Tesseract from 'tesseract.js';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import CustomBackgroundWrapper from '../../components/CustomBackgroundWrapper.vue'
import { useRouter } from "vue-router";

let croppingCanvas: HTMLCanvasElement;

const state = useState()!;
const { t } = useTranslation();
const router = useRouter();

const isBusy = ref(false);
const canSave = ref(false);
const fileName = ref("");
const currentImage = ref<string>("");
const isScanModalOpen = ref<boolean>(false);
const scanModalText = ref<string>("");
const addContentTo = ref<number>(1);
const title = ref<string>("");
const ingredients = ref<string>("");
const steps = ref<string>("");
const notes = ref<string>("");

onMounted(() => {
    state.title = t("pages.recipe.importImage.title");
    state.menuOptions = [];
});

async function saveRecipes() {
    const parsedRecipe = new Recipe();
    parsedRecipe.title = title.value;
    parsedRecipe.score = 5;
    parsedRecipe.notes = notes.value;
    parsedRecipe.ingredients = ingredients.value
        .split("\n")
        .filter(item => item.replace(" ", "") != "")
        .map((x: any) => x.raw || x);

    parsedRecipe.steps = steps.value
        .split("\n")
        .filter(item => item.replace(" ", "") != "")
        .map((x: any) => x.raw || x);

    state.message = parsedRecipe;
    router.push('/recipe/0/edit?ocr=1');
}

function cropImagechanged(changed: any) {
    croppingCanvas = changed.canvas;
}

async function cropImage() {
    scanModalText.value = "";

    isBusy.value = true;

    const result = await Tesseract.recognize(
        croppingCanvas,
        'eng',
    );

    scanModalText.value += result.data.text.replaceAll("\n", " ") + "\n\n";

    isScanModalOpen.value = true;
    isBusy.value = false;
}

async function pickFile() {
    canSave.value = false;

    // Open a file.
    const filePicked = await fileOpen({
        mimeTypes: ["image/*"]
    });

    fileName.value = filePicked.name;

    let success = true;

    try {
        isBusy.value = true;

        currentImage.value = await blobToBase64(filePicked);

        canSave.value = true;

        state.menuOptions = [{
            text: t("general.save"),
            action: saveRecipes,
            svg: `<path stroke="none" d="M0 0h24v24H0z"/>  <path d="M14 3v4a1 1 0 0 0 1 1h4" />  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />  <path d="M9 15l2 2l4 -4" />`,
        }];
    }
    catch (error) {
        console.error(error);
        success = false;
    }
    finally {
        isBusy.value = false;
        if (!success) {
            notify(
                {
                    group: "error",
                    title: t("general.error"),
                    text: t("pages.recipe.importImage.parsedFailed"),
                },
                2000
            );
        }
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });
}

function acceptScan() {
    switch (addContentTo.value) {
        case 1:
            title.value += scanModalText.value;
            break;
        case 2:
            ingredients.value += scanModalText.value;
            break;
        case 3:
            steps.value += scanModalText.value;
            break;
        case 4:
            notes.value += scanModalText.value;
            break;

        default:
            break;
    }

    isScanModalOpen.value = false;
}
</script>

<template>
    <div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
                <div class="flex mt-3">
                    <button class="bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-4 rounded-sm "
                        data-testid="import-button" @click="pickFile">{{ t("pages.recipe.importImage.selectFile")
                        }}</button>
                    <label class="ml-4 align-middle">{{ fileName }}</label>
                </div>
                <cropper :background-wrapper-component="CustomBackgroundWrapper" class="cropper mt-3" @change="cropImagechanged" :src="currentImage" />
            </div>
            <div v-if="canSave">
                <div class="mt-3">
                    <div class="flex mt-3">
                        <button :disabled="!canSave"
                            class="bg-theme-primary hover:bg-theme-secondary text-white font-bold py-2 px-4 rounded-sm "
                            data-testid="crop-image-button" @click="cropImage">{{
                                t("pages.recipe.importImage.scanSelection") }}</button>
                    </div>
                    <label for="recipeTitle">{{ t("pages.recipe.importImage.recipeTitle") }}</label>
                    <input id="recipeTitle" class="block p-2 w-full rounded-sm bg-white text-black shadow-xs" v-model="title" />
                    <label for="recipeIngredients">{{ t("pages.recipe.importImage.recipeIngredients") }}</label>
                    <textarea id="recipeIngredients" class="block p-2 flex-auto w-full h-60 bg-white rounded-sm text-base text-black"
                        v-model="ingredients"></textarea>
                    <label for="recipeSteps">{{ t("pages.recipe.importImage.recipeSteps") }}</label>
                    <textarea id="recipeSteps" class="block p-2 flex-auto w-full h-60 bg-white rounded-sm text-base text-black"
                        v-model="steps"></textarea>
                    <label for="recipeNotes">{{ t("pages.recipe.importImage.recipeNotes") }}</label>
                    <textarea id="recipeNotes" class="block p-2 flex-auto w-full h-60 bg-white rounded-sm text-base text-black"
                        v-model="notes"></textarea>
                </div>
            </div>
        </div>

        <BusyIndicator :busy="isBusy" :message1="t('pages.recipe.importImage.processing1')"
            :message2="t('pages.recipe.importImage.processing2')" />

        <Modal :isOpen="isScanModalOpen" @closed="isScanModalOpen = false" :title="'Scan result'" :buttons="[
            {
                title: t('general.ok'),
                action: () => acceptScan(),
            },
            {
                title: t('general.cancel'),
                danger: true,
                action: () => isScanModalOpen = false,
            },
        ]">
            <div>
                <div class="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
                    role="alert">
                    <span class="font-medium">{{ t("pages.recipe.importImage.tip") }}</span>
                    {{ t("pages.recipe.importImage.tipContent") }}
                </div>
                <textarea class="block p-2 flex-auto w-full h-60 bg-white rounded-sm text-base text-black"
                    v-model="scanModalText"></textarea>
            </div>
            <div class="mt-4">
                <label class="text-white">{{ t("pages.recipe.importImage.addContentTo") }}</label>
                <div class="flex mt-2">
                    <div class="flex items-center mb-4 mr-4">
                        <input id="typeTitle" name="type" type="radio" :value="1" v-model="addContentTo"
                            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                        <label for="typeTitle" class="ml-2 dark:text-white">{{ t("pages.recipe.importImage.recipeTitle")
                        }}</label>
                    </div>
                    <div class="flex items-center mb-4 mr-4">
                        <input id="typeIngredients" name="type" type="radio" :value="2" v-model="addContentTo"
                            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                        <label for="typeIngredients" class="ml-2 dark:text-white">{{
                            t("pages.recipe.importImage.recipeIngredients") }}</label>
                    </div>
                    <div class="flex items-center mb-4 mr-4">
                        <input id="typeSteps" name="type" type="radio" :value="3" v-model="addContentTo"
                            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                        <label for="typeSteps" class="ml-2 dark:text-white">{{ t("pages.recipe.importImage.recipeSteps")
                        }}</label>
                    </div>
                    <div class="flex items-center mb-4 mr-4">
                        <input id="typeNotes" name="type" type="radio" :value="4" v-model="addContentTo"
                            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                        <label for="typeNotes" class="ml-2 dark:text-white">{{ t("pages.recipe.importImage.recipeNotes")
                        }}</label>
                    </div>
                </div>
            </div>
        </Modal>
    </div>
</template>
