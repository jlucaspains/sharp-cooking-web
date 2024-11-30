import { fileOpen } from "browser-fs-access";
import { fetchWithRetry } from "../services/fetchWithRetry";

export async function pickImage(): Promise<string | undefined> {
    let result;
    const imagePicked = await fileOpen({
        mimeTypes: ["image/*"],
    });

    const data = new FormData();
    data.append('file', imagePicked);

    let responseOk = false;
    try {
        const response = await fetchWithRetry("/api/process-image", {
            method: "POST",
            body: data
        });

        responseOk = response.ok;

        if (responseOk) {
            const responseJson = await response.json();
            result = responseJson.image;
        }
    } catch (error) {
        responseOk = false
    }

    if (!responseOk) {
        console.log("image failed to load, using default.")
        result = "https://via.placeholder.com/150";
    }

    return result;

}