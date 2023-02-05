<script setup lang="ts">
import { useTranslation } from "i18next-vue";
import { ref, onMounted, onBeforeMount } from "vue";
import Modal from "./Modal.vue";
import {
    saveSetting,
    getSetting
} from "../services/dataService";

const { t } = useTranslation();

let deferredPrompt: any;
const showInstallPromptModal = ref(false);
const showInstallManualModal = ref(false);

onMounted(async () => {
    if (isAppInstalled() || await doNotAskToInstall()) {
        console.log("App already installed or user opted out");
        return;
    }

    tryPromptInstallation();
});

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches;
}

async function doNotAskToInstall() {
    return await getSetting("DoNotAskToInstall", "false") === "true"
        || localStorage.getItem("DoNotAskToInstall") === "true";
}


function tryPromptInstallation() {
    if (!('BeforeInstallPromptEvent' in window)) {
        showInstallManualModal.value = true;
        return;
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPromptModal.value = true;
    });

    window.addEventListener('appinstalled', (e) => {
        showInstallPromptModal.value = false;
    });
}

async function promptInstallApp() {
    if (!deferredPrompt) {
        return;
    }

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    deferredPrompt = null;

    showInstallPromptModal.value = false;
}
async function saveDoNotAskToInstall() {
    await saveSetting("DoNotAskToInstall", "true");
    showInstallPromptModal.value = false;
    showInstallManualModal.value = false;
}
</script>

<template>
    <Modal :isOpen="showInstallPromptModal" :title="t('installPrompt.title')" :buttons="[
        {
            title: t('installPrompt.stopAsking'),
            action: async () => await saveDoNotAskToInstall(),
        },
        {
            title: t('general.no'),
            action: () => showInstallPromptModal = false,
        },
        {
            title: t('general.yes'),
            action: promptInstallApp,
            focus: true
        },
    ]">
        <p class="dark:text-white">{{ t("installPrompt.installWithPromptMessage") }}</p>
    </Modal>
    <Modal :isOpen="showInstallManualModal" :title="t('installPrompt.title')" :buttons="[
        {
            title: t('installPrompt.stopAsking'),
            action: async () => await saveDoNotAskToInstall(),
        },
        {
            title: t('general.ok'),
            action: () => showInstallManualModal = false,
            focus: true
        }
    ]">
        <p class="dark:text-white">{{ t("installPrompt.installManualMessage") }}</p>
    </Modal>
</template>
