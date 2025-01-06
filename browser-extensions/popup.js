chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
    });
});

chrome.runtime.onMessage.addListener(
    function (request) {
        if (request.contentScriptQuery == "parseRecipeResult") {
            document.getElementById("sharp-cooking-code").innerHTML = request.code || "";
            document.getElementById("sharp-cooking-message").innerHTML = request.error || "";

            new QRCode(document.getElementById("qrcode"), {
                text: request.code,
                width: 128,
                height: 128
            });

            return false; // there is no need to respond
        }
    }
);