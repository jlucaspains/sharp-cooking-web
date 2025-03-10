chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "parseRecipe") {
            parseRecipe(request.url, request.downloadImage, request.body, sendResponse);

            return true; // Will respond asynchronously.
        }
    });

function parseRecipe(url, downloadImage, body, sendResponse) {
    const postFile = new Blob([body], {
        type: 'application/x-object'
    });

    const data = new FormData();
    data.append('file', postFile);
    data.append('url', url);
    data.append('downloadImage', downloadImage);

    let options = {
        method: "POST",
        body: data
    };

    fetch(`https://sharpcooking.lpains.net/api/parse-recipe-html`, options)
        .then(async response => {
            if (response.ok) {
                const data = await response.json();
                shareParsedRecipe(data, sendResponse);

            } else {
                const error = await response.text();
                chrome.runtime.sendMessage(
                    { contentScriptQuery: "parseRecipeResult", error: error },
                );
            }
        })
        .catch(error => {
            chrome.runtime.sendMessage(
                { contentScriptQuery: "parseRecipeResult", error: error },
            );
            console.log(error);
        });
}

function shareParsedRecipe(parseResult, sendResponse) {
    const body = {
        title: parseResult.title,
        ingredients: parseResult.ingredients.map(item => item.raw),
        steps: parseResult.steps.map(item => item.raw),
        notes: "",
        source: parseResult.host ?? "imported from browser",
        media: []
    };
    let options = {
        method: "POST",
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    };

    fetch(`https://sharpcooking.lpains.net/api/share-recipe`, options)
        .then(async response => {
            let messageToBeSent;
            if (response.ok) {
                const data = await response.json();
                sendResponse(data.id)
                messageToBeSent = { contentScriptQuery: "parseRecipeResult", code: data.id };

            } else {
                const error = await response.text();
                messageToBeSent = { contentScriptQuery: "parseRecipeResult", error };
            }
            chrome.runtime.sendMessage(messageToBeSent);
        })
        .catch(error => {
            chrome.runtime.sendMessage(
                { contentScriptQuery: "parseRecipeResult", error: error },
            );
            console.log(error);
        });
}