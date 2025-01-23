<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { Html5Qrcode } from "html5-qrcode";

const emit = defineEmits<{
    (e: "codeScanned", value: string): void;
}>();

let html5QrCode: Html5Qrcode;

onMounted(async () => {
    setupScanner();
});

onUnmounted(() => {
    html5QrCode?.stop();
});

function setupScanner() {
    html5QrCode = new Html5Qrcode(/* element id */ "reader");
    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText, decodedResult) => {
            emit("codeScanned", decodedText);
            html5QrCode.pause(true);
        },
        (errorMessage) => {
            // parse error, ignore it.
        })
        .catch((err) => {
            // Start failed, handle it.
        });
}
</script>

<template>
    <div id="reader" width="600px"></div>
</template>