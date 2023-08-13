export async function fetchWithRetry(url: RequestInfo | URL, options?: RequestInit | undefined, retries: number = 0): Promise<Response> {
    const res = await fetch(url, options);

    if (res.ok) {
        return res;
    }

    if (retries > 0) {
        return fetchWithRetry(url, options, retries - 1)
    } else {
        return res;
    }
}