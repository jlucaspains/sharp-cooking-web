chrome.runtime.sendMessage(
    { contentScriptQuery: "parseRecipe", url: document.URL, downloadImage: false },
    response => console.log(response));