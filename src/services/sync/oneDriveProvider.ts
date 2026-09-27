import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";
import { getSetting, saveSetting } from "../dataService";
import { CloudProvider, CloudProviderAccount, RemoteFile } from "./cloudProvider";

const SCOPES = ["Files.ReadWrite.AppFolder"];
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const SYNC_FILE_PATH = "/me/drive/special/approot:/sharp-cooking-sync.json";

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
    if (msalInstance) {
        return msalInstance;
    }

    const clientId = await getSetting("OneDriveClientId", "");
    if (!clientId) {
        throw new Error("OneDrive client id is not configured");
    }

    msalInstance = new PublicClientApplication({
        auth: {
            clientId,
            authority: "https://login.microsoftonline.com/common",
            // Points at a bare static page (public/auth.html), not the Vue app itself. Login
            // only ever happens via loginPopup/acquireTokenPopup here (never a full-page
            // redirect), and the response comes back as a URL hash - if that hash lands on
            // the real app, the hash-based Vue Router tries to match it as a route and
            // errors out before/while MSAL reads the auth code from it.
            redirectUri: `${window.location.origin}/auth.html`,
        },
        cache: {
            cacheLocation: "localStorage",
        },
    });

    await msalInstance.initialize();

    return msalInstance;
}

// MSAL sets a lock while a login/token popup is open to stop a second one starting
// concurrently, historically tracked under this sessionStorage key, and clears it itself
// once that popup completes normally. If a previous attempt died mid-flight (crashed tab,
// popup closed by hand) the lock can be left stuck, and every future loginPopup() call
// fails immediately with "interaction_in_progress". This is a best-effort recovery: removing
// a key that no longer exists is a harmless no-op either way.
function clearStuckInteractionLock(): void {
    try {
        sessionStorage.removeItem("msal.interaction.status");
    } catch {
        // sessionStorage inaccessible (private browsing, etc.) - nothing to clean up.
    }
}

function getAccount(instance: PublicClientApplication): AccountInfo | null {
    const accounts = instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
}

async function getAccessToken(): Promise<string> {
    const instance = await getMsalInstance();
    const account = getAccount(instance);

    if (!account) {
        throw new Error("Not connected to OneDrive");
    }

    try {
        const result = await instance.acquireTokenSilent({ scopes: SCOPES, account });
        return result.accessToken;
    } catch {
        const result = await acquireTokenPopupWithRecovery(instance, account);
        return result.accessToken;
    }
}

async function acquireTokenPopupWithRecovery(instance: PublicClientApplication, account: AccountInfo) {
    try {
        return await instance.acquireTokenPopup({ scopes: SCOPES, account });
    } catch (error: any) {
        if (error?.errorCode !== "interaction_in_progress") {
            throw error;
        }

        clearStuckInteractionLock();
        return await instance.acquireTokenPopup({ scopes: SCOPES, account });
    }
}

export class OneDriveProvider implements CloudProvider {
    readonly id = "onedrive";

    async isConnected(): Promise<boolean> {
        const clientId = await getSetting("OneDriveClientId", "");
        if (!clientId) {
            return false;
        }

        const instance = await getMsalInstance();
        return getAccount(instance) !== null;
    }

    async connect(): Promise<CloudProviderAccount> {
        const instance = await getMsalInstance();

        let result;
        try {
            result = await instance.loginPopup({ scopes: SCOPES });
        } catch (error: any) {
            if (error?.errorCode !== "interaction_in_progress") {
                throw error;
            }

            // A previous attempt (crashed tab, popup closed by hand) left MSAL's lock
            // stuck - clear it and give this attempt one clean retry.
            clearStuckInteractionLock();
            result = await instance.loginPopup({ scopes: SCOPES });
        }

        instance.setActiveAccount(result.account);
        await saveSetting("OneDriveAccountName", result.account.username);

        return { displayName: result.account.username };
    }

    async disconnect(): Promise<void> {
        const instance = await getMsalInstance();
        const account = getAccount(instance);

        if (account) {
            await instance.clearCache({ account });
        }

        await saveSetting("OneDriveAccountName", "");
    }

    async getRemoteFile(): Promise<RemoteFile | null> {
        const token = await getAccessToken();
        const response = await fetch(`${GRAPH_BASE}${SYNC_FILE_PATH}:/content`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to download OneDrive sync file: ${response.status}`);
        }

        const content = await response.text();
        const etag = response.headers.get("etag") ?? "";

        return { content, etag };
    }

    async putRemoteFile(content: string, expectedEtag: string | null): Promise<{ success: boolean; etag?: string }> {
        const token = await getAccessToken();
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        if (expectedEtag) {
            headers["If-Match"] = expectedEtag;
        }

        const response = await fetch(`${GRAPH_BASE}${SYNC_FILE_PATH}:/content`, {
            method: "PUT",
            headers,
            body: content,
        });

        if (response.status === 412) {
            return { success: false };
        }

        if (!response.ok) {
            throw new Error(`Failed to upload OneDrive sync file: ${response.status}`);
        }

        const json = await response.json();
        return { success: true, etag: json.eTag ?? json.etag };
    }
}
