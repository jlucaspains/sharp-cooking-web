<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useState } from "../services/store";
import { useTranslation } from "i18next-vue";
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats    } from "html5-qrcode";

const { t } = useTranslation();

const state = useState()!;

let html5QrcodeScanner: Html5QrcodeScanner;

onMounted(async () => {
    state.title = t("pages.categories.title");
    state.menuOptions = [];
    setupScanner();
});

function setupScanner() {
    function onScanSuccess(decodedText: string) {
        // handle the scanned code as you like, for example:
        console.log(`Code matched = ${decodedText}`);
        html5QrcodeScanner.pause(true);
    }

    function onScanFailure(error: string) {
        // handle scan failure, usually better to ignore and keep scanning.
        // for example:
        console.warn(`Code scan error = ${error}`);
    }

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        {
            fps: 10,
            useBarCodeDetectorIfSupported: true,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            defaultZoomValueIfSupported: 1.5,
            supportedScanTypes: [
                Html5QrcodeScanType.SCAN_TYPE_CAMERA
            ],
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE
            ],
            qrbox: {width: 250, height: 250}
        }, false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

</script>

<template>
    <div id="reader" width="600px"></div>
</template>
