<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { useTranslation } from "i18next-vue";
import { notify } from "notiwind";
import { getAllCategories, saveCategory, deleteCategory } from "../services/dataService";
import { Category } from "../services/category";
import Modal from "../components/Modal.vue";
import { pickImage } from "../helpers/imageHelpers";
import BusyIndicator from "../components/BusyIndicator.vue";

const { t } = useTranslation();

const state = useState()!;
const categories = ref([] as Array<Category>);
const isNewCategoryModalOpen = ref(false);
const isEditCategoryModalOpen = ref(false);
const categoryName = ref("");
const categoryImage = ref<string | null>(null);
const isDeleteModalOpen = ref(false);
const selectedCategory = ref<Category | null>(null);
const isProcessingImage = ref(false);

onMounted(async () => {
  state.title = t("pages.categories.title");
  state.menuOptions = [
    {
      text: t("pages.categories.more"),
      children: [
        {
          text: t("pages.categories.edit"),
          action: editCategory,
        },
        {
          text: t("pages.categories.delete"),
          action: confirmDeleteItem,
        }
      ],
      svg: `<circle cx="12" cy="12" r="1" />  <circle cx="12" cy="5" r="1" />  <circle cx="12" cy="19" r="1" />`,
    }
  ]

  await loadCategories();
});

function confirmDeleteItem() {
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
  categoryImage.value = null;
  categoryName.value = "";
  isNewCategoryModalOpen.value = true;
}

function editCategory() {
  categoryImage.value = selectedCategory.value?.image || null;
  categoryName.value = selectedCategory.value?.name || "";
  isEditCategoryModalOpen.value = true;
}

async function createNewCategory() {
  const newCategory = new Category();
  newCategory.name = categoryName.value;
  newCategory.image = categoryImage.value ?? "https://via.placeholder.com/150";

  await saveCategory(newCategory);
  await loadCategories();
  isNewCategoryModalOpen.value = false;
}

async function updateCategory() {
  if (!selectedCategory.value) {
    return;
  }

  selectedCategory.value.name = categoryName.value;
  selectedCategory.value.image = categoryImage.value ?? "https://via.placeholder.com/150";

  const category = JSON.parse(JSON.stringify(selectedCategory.value));

  await saveCategory(category);
  await loadCategories();
  isEditCategoryModalOpen.value = false;
}

async function selectImage() {
  const imageSelected = await pickImage((status) => isProcessingImage.value = status);

  if (imageSelected) {
    categoryImage.value = imageSelected;
  }
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
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ">
        <div v-for="category in categories" @click="selectCategory(category)" :class="{
          'p-2 rounded-lg cursor-pointer hover:bg-theme-primary active:bg-theme-secondary focus:outline-none': true,
          'category-item': true,
          'bg-theme-secondary': selectedCategory === category
        }">
          <img :src="category.image" alt="Category" class="w-full h-32 object-cover rounded-lg" />
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
      <input type="text" v-model="categoryName" data-testid="new-category-name"
        class="block my-2 p-2 w-full rounded text-black shadow-sm" />
      <button @click="selectImage" class="bg-theme-primary block my-2 p-2 w-full rounded text-white shadow-sm">
        {{ t('pages.categories.selectImage') }}</button>
      <img v-if="categoryImage" :src="categoryImage" alt="Selected image" class="object-cover rounded-lg" />
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
        class="block my-2 p-2 w-full rounded text-black shadow-sm" />
      <button @click="selectImage" class="bg-theme-primary block my-2 p-2 w-full rounded text-white shadow-sm">
        {{ t('pages.categories.selectImage') }}</button>
      <img v-if="categoryImage" :src="categoryImage" alt="Selected image" class="object-cover rounded-lg" />
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
    <BusyIndicator :busy="isProcessingImage" :message1="t('pages.categories.processImage1')"
      :message2="t('pages.categories.processImage2')" />
  </div>
</template>