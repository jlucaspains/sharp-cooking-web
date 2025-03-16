<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { useTranslation } from "i18next-vue";
import { notify } from "notiwind";
import { getAllCategories, saveCategory, deleteCategory } from "../services/dataService";
import { Category } from "../services/category";
import Modal from "../components/Modal.vue";

const { t } = useTranslation();

const state = useState()!;
const categories = ref([] as Array<Category>);
const isNewCategoryModalOpen = ref(false);
const isEditCategoryModalOpen = ref(false);
const categoryName = ref("");
const isDeleteModalOpen = ref(false);
const selectedCategory = ref<Category | null>(null);

onMounted(async () => {
  state.title = t("pages.categories.title");
  
  await loadCategories();
});

function confirmDeleteItem(id: number) {
  selectedCategory.value = categories.value.find((c) => c.id === id) ?? null;

  isDeleteModalOpen.value = true;
}

async function deleteItem() {
  try {
    isDeleteModalOpen.value = false;
    await deleteCategory(selectedCategory.value?.id || 0);

    notify(
      {
        group: "success",
        title: t("general.success"),
        text: t("pages.categories.categoryDeleted"),
      },
      2000
    );

    await loadCategories();
  } catch {
    notify(
      {
        group: "error",
        title: t("general.error"),
        text: t("pages.categories.categoryDeleteFailed"),
      },
      2000
    );
  }
}

async function loadCategories() {
  categories.value = await getAllCategories();
}

function addCategory() {
  categoryName.value = "";
  isNewCategoryModalOpen.value = true;
}

function editCategory(id: number) {
  selectedCategory.value = categories.value.find((c) => c.id === id) || null;
  categoryName.value = selectedCategory.value?.name || "";
  isEditCategoryModalOpen.value = true;
}

async function createNewCategory() {
  const newCategory = new Category();
  newCategory.name = categoryName.value;

  await saveCategory(newCategory);
  await loadCategories();
  isNewCategoryModalOpen.value = false;
}

async function updateCategory() {
  if (!selectedCategory.value) {
    return;
  }

  selectedCategory.value.name = categoryName.value;

  const category = JSON.parse(JSON.stringify(selectedCategory.value));

  await saveCategory(category);
  await loadCategories();
  isEditCategoryModalOpen.value = false;
}

function selectCategory(category: Category) {
  selectedCategory.value = category;
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
      <div class="grid gap-3 ">

        <div v-for="category in categories" @click="selectCategory(category)" :class="{
          'h-12 shadow overflow-hidden rounded-lg bg-white dark:bg-theme-secondary-gray hover:bg-gray-600 focus:outline-hidden': true,
          'category-item': true,
          'bg-theme-secondary': selectedCategory === category
        }">
          <div class="flex px-3 py-2">
            <div class="truncate grow pe-2">
              <span class="text-ellipsis text-black dark:text-white text-lg">
                {{ category.name }}
              </span>
            </div>
            <div class="mx-1">
              <button class="cursor-pointer" data-testid="edit-category" @click="() => editCategory(category.id)">
                <svg class="h-5 w-5 text-white m-auto" width="24" height="24" viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
              </button>
              <button class="ps-2 cursor-pointer" data-testid="delete-category" @click="() => confirmDeleteItem(category.id)">
                <svg class="text-black dark:text-white" width="24" height="24" viewBox="0 0 24 24" stroke-width="2"
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
          </div>
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
      <input type="text" v-model="categoryName" data-testid="new-category-name"
        class="block my-2 p-2 w-full rounded-sm bg-white text-black shadow-xs" />
    </Modal>
    <Modal :isOpen="isEditCategoryModalOpen" @closed="isEditCategoryModalOpen = false"
      :title="t('pages.categories.editTitle')" :buttons="[
        {
          title: t('general.cancel'),
          action: () => isEditCategoryModalOpen = false,
        },
        {
          title: t('general.ok'),
          action: async () => await updateCategory(),
        },
      ]">
      <input type="text" v-model="categoryName" data-testid="edit-category-name"
        class="block my-2 p-2 w-full rounded-sm bg-white text-black shadow-xs" />
    </Modal>
    <Modal :isOpen="isDeleteModalOpen" @closed="isDeleteModalOpen = false"
      :title="t('pages.categories.deleteModalTitle')" :buttons="[
        {
          title: t('general.no'),
          action: () => {
            isDeleteModalOpen = false;
          },
        },
        {
          title: t('pages.categories.deleteYes'),
          danger: true,
          action: deleteItem,
        },
      ]">
      <span class="dark:text-white">{{ t("pages.categories.deleteModalBody") }}</span>
    </Modal>
  </div>
</template>