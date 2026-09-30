<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { useTranslation } from "i18next-vue";
import { getSetting, saveSetting } from "../services/dataService";
import { CloudProvider } from "../services/sync/cloudProvider";
import { getProvider, syncNow } from "../services/sync/syncService";
import { notify } from "notiwind";
import BusyIndicator from "../components/BusyIndicator.vue";
import ConfigSwitch from "../components/ConfigSwitch.vue";

const { t } = useTranslation();
const state = useState()!;

const provider: CloudProvider = getProvider();

const oneDriveClientId = ref("");
const isConnected = ref(false);
const accountName = ref("");
const autoSyncEnabled = ref(false);
const lastSyncedAt = ref("");
const isBusy = ref(false);
const needsReauth = ref(false);

onMounted(async () => {
  state.title = t("pages.cloud-sync.title");
  state.menuOptions = [];

  oneDriveClientId.value = await getSetting("OneDriveClientId", "");
  accountName.value = await getSetting("OneDriveAccountName", "");
  autoSyncEnabled.value = (await getSetting("AutoSyncEnabled", "false")) === "true";
  lastSyncedAt.value = await getSetting("LastSyncedAt", "");
  isConnected.value = await provider.isConnected();
  needsReauth.value = isConnected.value && (await getSetting("SyncNeedsReauth", "false")) === "true";
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
    needsReauth.value = false;
    await saveSetting("SyncNeedsReauth", "false");

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
    needsReauth.value = false;

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
      <div v-if="needsReauth" data-testid="onedrive-reauth-warning"
        class="mt-4 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 rounded text-yellow-800 dark:text-yellow-200 text-sm">
        <span class="font-semibold">{{ t("pages.cloud-sync.reauthRequiredTitle") }}</span>
        <div>{{ t("pages.cloud-sync.reauthRequiredText") }}</div>
        <button @click="connect" data-testid="onedrive-reconnect-button" class="mt-2 font-semibold underline">
          {{ t("pages.cloud-sync.reconnect") }}
        </button>
      </div>
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
