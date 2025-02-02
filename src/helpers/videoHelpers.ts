
export function isVideoUrlSupported(url: string) {
    return !url
        || url.startsWith("https://www.youtube.com/")
        || url.startsWith("https://m.youtube.com/")
        || url.startsWith("https://youtu.be/");
}

export function getThumbnail(url: string) {
    const id = getVideoId(url);

    return `https://img.youtube.com/vi/${id}/0.jpg`;
}

export function prepareUrlForEmbed(url: string) {
    const id = getVideoId(url);

    return `https://www.youtube.com/embed/${id}`;
}

function getVideoId(url: string) {
    const regexp = /watch\?v=([\w-]*)|embed\/([\w-]*)|youtu\.be\/([\w-]*)/;

    // get the capture group from regexp
    const match = regexp.exec(url);
    if (!match) {
        return "";
    }

    // there are 3 possible matches in the regex
    // the code below checks for all of them 
    // and returns the first one that is not null
    return match[1] || match[2] || match[3];
}