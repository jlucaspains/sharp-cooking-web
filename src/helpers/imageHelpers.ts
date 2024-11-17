import { fileOpen } from "browser-fs-access";
import { fetchWithRetry } from "../services/fetchWithRetry";

export async function pickImage(): Promise<string | undefined> {
    let result;
    const imagePicked = await fileOpen({
        mimeTypes: ["image/*"],
    });

    const data = new FormData();
    data.append('file', imagePicked);

    const response = await fetchWithRetry("/api/process-image", {
        method: "POST",
        body: data
    });

    if (!response.ok) {
        return;
    }

    result = await response.json();

    return result.image;

}