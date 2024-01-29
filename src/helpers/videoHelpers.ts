export function isVideoUrlSupported(url: string) {
    return !url
        || url.startsWith("https://www.youtube.com/")
        || url.startsWith("https://youtu.be/");
}

export function prepareUrlForEmbed(url: string) {
    const regexp = /watch\?v=([\w-]*)|embed\/([\w-]*)|youtu\.be\/([\w-]*)/;

    // get the capture group from regexp
    const match = regexp.exec(url);
    if (!match || match.length < 2) {
        return "";
    }

    return `https://www.youtube.com/embed/${match[1]}`;
}