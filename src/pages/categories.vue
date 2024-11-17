<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useState } from "../services/store";
import { saveSetting, getSetting } from "../services/dataService";
import { useTranslation } from "i18next-vue";
import ConfigSwitch from "../components/ConfigSwitch.vue";
import { getAllCategories, createCategory } from "../services/dataService";
import { Category } from "../services/category";
import Modal from "../components/Modal.vue";
import { pickImage } from "../helpers/imageHelpers";

const { t, i18next } = useTranslation();

const state = useState()!;
const router = useRouter()!;
const categories = ref([] as Array<Category>);
const isNewCategoryModalOpen = ref(false);
const newCategoryName = ref("");
const newCategoryImage = ref("");

onMounted(async () => {
    state.title = t("pages.categories.title");
    state.menuOptions = [];

    await loadCategories();
});

async function loadCategories() {
    categories.value = await getAllCategories();
}

function addCategory() {
    isNewCategoryModalOpen.value = true;
}

async function createNewCategory() {
    const newCategory = new Category();
    newCategory.name = newCategoryName.value;
    newCategory.image = newCategoryImage.value ?? "https://via.placeholder.com/150";

    await createCategory(newCategory);
    await loadCategories();
    isNewCategoryModalOpen.value = false;
}

async function selectImage() {
    const imageSelected = await pickImage();

    if (imageSelected) {
        newCategoryImage.value = imageSelected;
    }
}
</script>

<template>
    <div>
        <div class="p-0 w-14 h-14 fixed bottom-6 right-6">
            <div>
                <button @click="addCategory" data-testid="add-menu-button" class="
                w-12
                h-12
                m-1
                rounded-full
                bg-theme-primary
                hover:bg-theme-secondary
                focus:bg-theme-secondary
                focus:shadow-lg
                shadow-md
                hover:shadow-lg
                ">
                    <svg viewBox="0 0 20 20" enable-background="new 0 0 20 20" class="w-6 h-6 inline-block">
                        <path fill="#FFFFFF" d="M16,10c0,0.553-0.048,1-0.601,1H11v4.399C11,15.951,10.553,16,10,16c-0.553,0-1-0.049-1-0.601V11H4.601
                                C4.049,11,4,10.553,4,10c0-0.553,0.049-1,0.601-1H9V4.601C9,4.048,9.447,4,10,4c0.553,0,1,0.048,1,0.601V9h4.399
                                C15.952,9,16,9.447,16,10z" />
                    </svg>
                </button>
            </div>
        </div>
        <div class="w-full lg:px-40 mx-auto">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ">
                <div v-for="category in categories"
                    class="p-2 rounded-lg cursor-pointer hover:bg-theme-primary active:bg-theme-secondary focus:outline-none">
                    <img :src="category.image" alt="Category image" class="w-full h-32 object-cover rounded-lg" />
                    <div class="text-center mt-2">{{ category.name }}</div>
                </div>
            </div>
        </div>
        <Modal :isOpen="isNewCategoryModalOpen" @closed="isNewCategoryModalOpen = false"
            :title="t('pages.categories.newTitle')" :buttons="[
                {
                    title: t('general.cancel'),
                    action: () => isNewCategoryModalOpen = false,
                },
                {
                    title: t('general.ok'),
                    action: async () => await createNewCategory(),
                },
            ]">
            <input type="text" v-model="newCategoryName" data-testid="new-category-name"
                class="block my-2 p-2 w-full rounded text-black shadow-sm" />
            <button @click="selectImage" class="block my-2 p-2 w-full rounded text-black shadow-sm">
                {{ t('pages.categories.selectImage') }}></button>
        </Modal>
    </div>
</template>