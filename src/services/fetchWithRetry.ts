export async function fetchWithRetry(url: RequestInfo | URL, options?: RequestInit | undefined, retries: number = 0): Promise<Response> {
    const res = await fetch(url, options);
    const statusesToRetry = [408, 429, 500, 502, 503, 504];

    if (res.ok || retries == 0 || !statusesToRetry.includes(res.status)) {
        return res;
    }

    return fetchWithRetry(url, options, retries - 1)
}