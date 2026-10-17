<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useState } from "../services/store";
import { getSetting, prepareBackup } from "../services/dataService";
import { fileSave } from "browser-fs-access";
import { useTranslation } from "i18next-vue";

const { t } = useTranslation();

const state = useState()!;
const router = useRouter()!;
const enableCloudSync = ref(false);

onMounted(async () => {
  state.title = t("pages.backup-sync.title");
  state.menuOptions = [];

  const enableCloudSyncValue = await getSetting("EnableCloudSync", "false");

  enableCloudSync.value = enableCloudSyncValue === "true";
});

async function takeBackup() {
  const backup = await prepareBackup();
  const stringBackup = JSON.stringify(backup);
  const blob = new Blob([stringBackup]);
  await fileSave(blob, { fileName: "sharp_cooking.json", mimeTypes: ["application/json"] });
}

function restoreBackup() {
  router.push("/recipe/import-backup");
}

function goToCloudSync() {
  router.push("/cloud-sync");
}
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="takeBackup">
      <span class="dark:text-white">{{ t("pages.backup-sync.takeBackup") }}</span>
      <div class="dark:text-white float-right ">
        <button data-testid="take-backup-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.backup-sync.takeBackupDescription") }}</span>
      </div>
    </div>
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="restoreBackup">
      <span class="dark:text-white">{{ t("pages.backup-sync.restoreBackup") }}</span>
      <div class="dark:text-white float-right ">
        <button data-testid="restore-backup-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.backup-sync.restoreBackupDescription") }}</span>
      </div>
    </div>
    <div v-if="enableCloudSync" class="mt-4 p-2 dark:text-white rounded-sm cursor-pointer active:bg-theme-secondary"
      @click="goToCloudSync">
      <label class="dark:text-white">{{ t("pages.backup-sync.cloudSync") }}</label>
      <div class="dark:text-white float-right ">
        <button data-testid="cloud-sync-button"><svg class="h-6 w-6" width="24" height="24" viewBox="0 0 24 24"
            stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <polyline points="9 6 15 12 9 18" />
          </svg></button>
      </div>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.backup-sync.cloudSyncDescription") }}</span>
      </div>
    </div>
  </div>
</template>
