const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function sendPageViewData(url: string, referrer: string): Promise<string> {
    const loadDateTime = new Date();
    const pageViewData = {
        url,
        timeZone,
        timestamp: loadDateTime.toISOString(),
        referrer
    };
    return fetch('https://sharp-web-insights.azurewebsites.net/api/A5NuO0rxqm/pageview', {
        method: 'POST',
        body: JSON.stringify(pageViewData),
        headers: { 'Content-Type': 'application/json' }
    })
        .then(response => {
            return response.text();
        });
}


export function sendPageViewDurationData(pageViewId: string, loadDateTime: Date): Promise<Response | null> {
    if (pageViewId === "") {
        return Promise.resolve(null);
    }

    const unloadDateTime = new Date();
    const diffMilliseconds = Math.abs(unloadDateTime.getTime() - loadDateTime.getTime());
    const diffSeconds = Math.round(diffMilliseconds / 1000);
    const pageViewDurationData = {
        id: pageViewId,
        durationSeconds: diffSeconds,
        timestamp: unloadDateTime.toISOString()
    };
    return fetch('https://sharp-web-insights.azurewebsites.net/api/A5NuO0rxqm/pageViewDuration', {
        method: 'POST',
        body: JSON.stringify(pageViewDurationData),
        headers: { 'Content-Type': 'application/json' }
    });
}