import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser";
import { saveSetting } from "../dataService";
import { CloudProvider, CloudProviderAccount, PutResult, RemoteFile, RemoteFileMeta } from "./cloudProvider";

const SCOPES = ["Files.ReadWrite.AppFolder"];
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const APP_ROOT = "/me/drive/special/approot";
const CATEGORIES_FILE_PATH = `${APP_ROOT}:/categories.json`;
const RECIPES_FOLDER_PATH = `${APP_ROOT}:/recipes`;
const msalClientId = "2bf61af4-a410-4a02-920b-c42f2e3a4c3f";

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
    if (msalInstance) {
        return msalInstance;
    }

    msalInstance = new PublicClientApplication({
        auth: {
            clientId: msalClientId,
            authority: "https://login.microsoftonline.com/common",
            redirectUri: `${window.location.origin}/auth.html`,
        },
        cache: {
            cacheLocation: "localStorage",
        },
    });

    await msalInstance.initialize();
    return msalInstance;
}

// Remove msal key to prevent stuck interactions.
function clearStuckInteractionLock(): void {
    try {
        sessionStorage.removeItem("msal.interaction.status");
    } catch {
        // nothing to clean up. Ignore.
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

async function graphFetch(url: string, init: RequestInit, retriesLeft = 2): Promise<Response> {
    const response = await fetch(url, init);

    if (response.status === 429 && retriesLeft > 0) {
        const retryAfterSeconds = Number(response.headers.get("Retry-After")) || 1;
        await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
        return graphFetch(url, init, retriesLeft - 1);
    }

    return response;
}

async function describeError(response: Response): Promise<string> {
    try {
        const body = await response.json();
        return body?.error?.message ?? JSON.stringify(body);
    } catch {
        return response.statusText;
    }
}

let recipesFolderEnsured = false;

async function ensureRecipesFolderExists(token: string): Promise<void> {
    if (recipesFolderEnsured) {
        return;
    }

    const response = await graphFetch(`${GRAPH_BASE}${RECIPES_FOLDER_PATH}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 404) {
        const approotResponse = await graphFetch(`${GRAPH_BASE}${APP_ROOT}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!approotResponse.ok) {
            throw new Error(`Failed to resolve OneDrive app folder: ${approotResponse.status} ${await describeError(approotResponse)}`);
        }

        const approot = await approotResponse.json();

        const createResponse = await graphFetch(`${GRAPH_BASE}/me/drive/items/${approot.id}/children`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ name: "recipes", folder: {}, "@microsoft.graph.conflictBehavior": "fail" }),
        });

        if (!createResponse.ok && createResponse.status !== 409) {
            throw new Error(`Failed to create OneDrive recipes folder: ${createResponse.status} ${await describeError(createResponse)}`);
        }
    } else if (!response.ok) {
        throw new Error(`Failed to check OneDrive recipes folder: ${response.status} ${await describeError(response)}`);
    }

    recipesFolderEnsured = true;
}

export class OneDriveProvider implements CloudProvider {
    readonly id = "OneDrive";

    async isConnected(): Promise<boolean> {
        const instance = await getMsalInstance();
        return getAccount(instance) !== null;
    }

    async hasSilentAccess(): Promise<boolean> {
        if (!(await this.isConnected())) {
            return false;
        }

        const instance = await getMsalInstance();

        try {
            // No popup fallback here - a throw means only an interactive sign-in can recover.
            await instance.acquireTokenSilent({ scopes: SCOPES, account: getAccount(instance)! });
            return true;
        } catch {
            return false;
        }
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

        recipesFolderEnsured = false;

        await saveSetting("OneDriveAccountName", "");
    }

    async getCategoriesFile(): Promise<RemoteFile | null> {
        return this.getFile(CATEGORIES_FILE_PATH);
    }

    async putCategoriesFile(content: string, expectedEtag: string | null): Promise<PutResult> {
        return this.putFile(CATEGORIES_FILE_PATH, content, expectedEtag);
    }

    async listRecipeFiles(): Promise<RemoteFileMeta[]> {
        const token = await getAccessToken();
        const result: RemoteFileMeta[] = [];
        let url: string | null =
            `${GRAPH_BASE}${RECIPES_FOLDER_PATH}:/children?$select=name,eTag,lastModifiedDateTime&$top=200`;

        while (url) {
            const response: Response = await graphFetch(url, { headers: { Authorization: `Bearer ${token}` } });

            if (response.status === 404) {
                // /recipes doesn't exist yet - nothing has ever been synced from any device.
                return [];
            }

            if (!response.ok) {
                throw new Error(`Failed to list OneDrive recipe files: ${response.status} ${await describeError(response)}`);
            }

            const json = await response.json();
            for (const item of json.value ?? []) {
                result.push({ name: item.name, etag: item.eTag, lastModifiedDateTime: item.lastModifiedDateTime });
            }

            url = json["@odata.nextLink"] ?? null;
        }

        return result;
    }

    async getRecipeFile(uuid: string): Promise<RemoteFile | null> {
        return this.getFile(`${RECIPES_FOLDER_PATH}/${uuid}.json`);
    }

    async putRecipeFile(uuid: string, content: string, expectedEtag: string | null): Promise<PutResult> {
        const token = await getAccessToken();
        await ensureRecipesFolderExists(token);

        return this.putFile(`${RECIPES_FOLDER_PATH}/${uuid}.json`, content, expectedEtag, token);
    }

    private async getFile(path: string): Promise<RemoteFile | null> {
        const token = await getAccessToken();
        const response = await graphFetch(`${GRAPH_BASE}${path}:/content`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to download OneDrive file ${path}: ${response.status} ${await describeError(response)}`);
        }

        const content = await response.text();
        const etag = response.headers.get("etag") ?? "";

        return { content, etag };
    }

    private async putFile(path: string, content: string, expectedEtag: string | null, token?: string): Promise<PutResult> {
        const accessToken = token ?? await getAccessToken();
        const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        };

        if (expectedEtag) {
            headers["If-Match"] = expectedEtag;
        }

        const response = await graphFetch(`${GRAPH_BASE}${path}:/content`, {
            method: "PUT",
            headers,
            body: content,
        });

        if (response.status === 412) {
            return { success: false };
        }

        if (!response.ok) {
            throw new Error(`Failed to upload OneDrive file ${path}: ${response.status} ${await describeError(response)}`);
        }

        const json = await response.json();
        return { success: true, etag: json.eTag ?? json.etag };
    }
}
