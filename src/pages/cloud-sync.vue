<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { useTranslation } from "i18next-vue";
import { getSetting, saveSetting } from "../services/dataService";
import { OneDriveProvider } from "../services/sync/oneDriveProvider";
import { CloudProvider } from "../services/sync/cloudProvider";
import { syncNow } from "../services/sync/syncService";
import { notify } from "notiwind";
import BusyIndicator from "../components/BusyIndicator.vue";
import ConfigSwitch from "../components/ConfigSwitch.vue";

const { t } = useTranslation();
const state = useState()!;

// Playwright can't drive the real Microsoft OAuth popup, so E2E tests inject a fake
// provider on `window.__testCloudProvider` (see tests/helpers.ts). Production always uses
// the real OneDriveProvider.
const provider: CloudProvider = (window as any).__testCloudProvider ?? new OneDriveProvider();

const oneDriveClientId = ref("");
const isConnected = ref(false);
const accountName = ref("");
const autoSyncEnabled = ref(false);
const lastSyncedAt = ref("");
const isBusy = ref(false);

onMounted(async () => {
  state.title = t("pages.cloud-sync.title");
  state.menuOptions = [];

  oneDriveClientId.value = await getSetting("OneDriveClientId", "");
  accountName.value = await getSetting("OneDriveAccountName", "");
  autoSyncEnabled.value = (await getSetting("AutoSyncEnabled", "false")) === "true";
  lastSyncedAt.value = await getSetting("LastSyncedAt", "");
  isConnected.value = await provider.isConnected();
});

function updateOneDriveClientId() {
  saveSetting("OneDriveClientId", `${oneDriveClientId.value}`);
}

function updateAutoSyncEnabled() {
  saveSetting("AutoSyncEnabled", `${autoSyncEnabled.value}`);
}

async function connect() {
  if (!oneDriveClientId.value) {
    notify({ group: "warning", title: t("general.warning"), text: t("pages.cloud-sync.clientIdRequired") }, 3000);
    return;
  }

  isBusy.value = true;

  try {
    const account = await provider.connect();
    isConnected.value = true;
    accountName.value = account.displayName;

    notify({ group: "success", title: t("general.success"), text: t("pages.cloud-sync.connectedSuccessfully") }, 3000);
  } catch (error) {
    console.error("Failed to connect to OneDrive", error);
    notify({ group: "error", title: t("general.error"), text: t("pages.cloud-sync.connectFailed") }, 3000);
  } finally {
    isBusy.value = false;
  }
}

async function disconnect() {
  isBusy.value = true;

  try {
    await provider.disconnect();
    isConnected.value = false;
    accountName.value = "";
  } finally {
    isBusy.value = false;
  }
}

async function runSync() {
  isBusy.value = true;

  try {
    const result = await syncNow(provider);
    lastSyncedAt.value = await getSetting("LastSyncedAt", "");

    const message = result.conflicts > 0
      ? t("pages.cloud-sync.syncCompleteWithConflicts", { pulled: result.pulled, pushed: result.pushed, conflicts: result.conflicts })
      : t("pages.cloud-sync.syncComplete", { pulled: result.pulled, pushed: result.pushed });

    notify({ group: result.conflicts > 0 ? "warning" : "success", title: t("general.done"), text: message }, 4000);
  } catch (error) {
    console.error("Failed to sync with OneDrive", error);
    notify({ group: "error", title: t("general.error"), text: t("pages.cloud-sync.syncFailed") }, 4000);
  } finally {
    isBusy.value = false;
  }
}
</script>

<template>
  <div class="w-full lg:px-40 mx-auto">
    <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
      <span class="dark:text-white">{{ t("pages.cloud-sync.clientId") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.cloud-sync.clientIdDescription") }}</span>
      </div>
      <input v-model="oneDriveClientId" @change="updateOneDriveClientId" placeholder="00000000-0000-0000-0000-000000000000"
        data-testid="onedrive-client-id-input"
        class="block p-2 w-full rounded-sm bg-white text-black shadow-xs">
    </div>

    <div v-if="!isConnected" class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="connect">
      <span class="dark:text-white">{{ t("pages.cloud-sync.connect") }}</span>
      <div>
        <span class="text-gray-500 text-sm">{{ t("pages.cloud-sync.connectDescription") }}</span>
      </div>
    </div>

    <template v-else>
      <div class="mt-4 p-2 rounded-sm">
        <span class="dark:text-white">{{ t("pages.cloud-sync.connectedAs", { account: accountName }) }}</span>
      </div>
      <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="disconnect"
        data-testid="onedrive-disconnect-button">
        <span class="dark:text-white">{{ t("pages.cloud-sync.disconnect") }}</span>
      </div>
      <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary" @click="runSync"
        data-testid="onedrive-sync-now-button">
        <span class="dark:text-white">{{ t("pages.cloud-sync.syncNow") }}</span>
        <div>
          <span class="text-gray-500 text-sm">
            {{ lastSyncedAt ? t("pages.cloud-sync.lastSyncedAt", { date: new Date(lastSyncedAt).toLocaleString() }) : t("pages.cloud-sync.neverSynced") }}
          </span>
        </div>
      </div>
      <div class="mt-4 p-2 rounded-sm cursor-pointer active:bg-theme-secondary">
        <config-switch v-model="autoSyncEnabled" @change="updateAutoSyncEnabled"
          :display-name="t('pages.cloud-sync.autoSync')"
          :display-description="t('pages.cloud-sync.autoSyncDescription')"
          test-id="auto-sync-toggle"></config-switch>
      </div>
    </template>

    <BusyIndicator :busy="isBusy" :message1="t('pages.cloud-sync.processing1')" :message2="t('pages.cloud-sync.processing2')" />
  </div>
</template>
