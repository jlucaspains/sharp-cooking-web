chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.contentScriptQuery == "parseRecipe") {

            const data = new FormData();
            data.append('file', null); // TODO: html file goes here
            data.append('url', request.url);
            data.append('downloadImage', request.downloadImage);

            // let postBody = { "url": request.url, "downloadImage": request.downloadImage };
            let options = {
                method: "POST",
                body: data
            };
            
            fetch(`https://sharpcooking.lpains.net/api/parse-recipe-html`, options)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error(`Something went wrong: ${response.status}`);
                    }
                })
                .then(data => {
                    console.log(data);
                    sendResponse(data);
                })
                .catch(error => {
                    console.log(error);
                });

            return true; // Will respond asynchronously.
        }
    });