chrome.runtime.sendMessage(
    { contentScriptQuery: "parseRecipe", url: document.URL, downloadImage: false, body: document.documentElement.outerHTML },
    response => console.log(response));