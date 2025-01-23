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
            document.getElementById("sharp-cooking-message").innerHTML = request.error || "Please scan the QR code with your Sharp Cooking app to import the recipe.";

            _ = new QRCode(document.getElementById("qrcode"), {
                text: request.code,
                width: 128,
                height: 128
            });

            return false; // there is no need to respond
        }
    }
);