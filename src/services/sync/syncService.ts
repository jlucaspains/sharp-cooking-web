import { BackupModel, RecipeBackupModel } from "../../pages/recipe/backupModel";
import {
    getSetting,
    saveSetting,
    getAllCategoriesForSync,
    getAllRecipesForSync,
    applySyncedCategory,
    applySyncedRecipe,
    prepareCategoriesSyncPayload,
    prepareRecipeSyncPayload,
    getRecipeSyncEtag,
    setRecipeSyncEtag,
} from "../dataService";
import { CloudProvider } from "./cloudProvider";
import { OneDriveProvider } from "./oneDriveProvider";

export interface SyncResult {
    pulled: number;
    pushed: number;
    conflicts: number;
}

interface SyncEntity {
    id?: number;
    uuid?: string;
    changedOn?: string;
    deletedOn?: string;
}

function effectiveTime(entity: SyncEntity): string {
    const changed = entity.changedOn ?? "";
    const deleted = entity.deletedOn ?? "";
    return deleted > changed ? deleted : changed;
}

// Last-write-wins by effective time (changedOn, or deletedOn if that's later) - a delete newer
// than the other side's edit wins, an edit newer than the other side's delete resurrects it. A
// conflict is only counted when both sides genuinely changed independently since the last sync.
function decideWinner(local: SyncEntity | undefined, remote: SyncEntity, lastSyncedAt: string) {
    if (!local) {
        return { winner: "remote" as const, conflict: false };
    }

    const localTime = effectiveTime(local);
    const remoteTime = effectiveTime(remote);
    const bothChangedSinceLastSync = localTime > lastSyncedAt && remoteTime > lastSyncedAt;

    return {
        winner: (remoteTime > localTime ? "remote" : "local") as "remote" | "local",
        conflict: bothChangedSinceLastSync && localTime !== remoteTime,
    };
}

// Used only for categories, which still sync as one small shared file/array.
function mergeEntities<T extends SyncEntity>(local: T[], remote: T[], lastSyncedAt: string) {
    const localByUuid = new Map(local.filter(e => e.uuid).map(e => [e.uuid!, e]));
    const remoteByUuid = new Map(remote.filter(e => e.uuid).map(e => [e.uuid!, e]));

    const toApplyLocally: Array<{ remote: T; localId: number | undefined }> = [];
    let localOnlyCount = 0;
    let conflicts = 0;

    for (const [uuid, remoteEntity] of remoteByUuid) {
        const localEntity = localByUuid.get(uuid);
        const decision = decideWinner(localEntity, remoteEntity, lastSyncedAt);

        if (decision.conflict) {
            conflicts++;
        }

        if (decision.winner === "remote") {
            toApplyLocally.push({ remote: remoteEntity, localId: localEntity?.id });
        }
    }

    for (const uuid of localByUuid.keys()) {
        if (!remoteByUuid.has(uuid)) {
            localOnlyCount++;
        }
    }

    return { toApplyLocally, localOnlyCount, conflicts };
}

async function getOrCreateDeviceId(): Promise<string> {
    let deviceId = await getSetting("SyncDeviceId", "");

    if (!deviceId) {
        deviceId = crypto.randomUUID();
        await saveSetting("SyncDeviceId", deviceId);
    }

    return deviceId;
}

async function syncCategories(provider: CloudProvider, deviceId: string, lastSyncedAt: string) {
    const localCategories = await getAllCategoriesForSync();
    const remoteFile = await provider.getCategoriesFile();
    const remoteSnapshot: BackupModel | null = remoteFile ? JSON.parse(remoteFile.content) : null;

    const merge = mergeEntities(localCategories, remoteSnapshot?.categories ?? [], lastSyncedAt);
    for (const { remote, localId } of merge.toApplyLocally) {
        await applySyncedCategory(remote, localId);
    }

    const payload = await prepareCategoriesSyncPayload(deviceId);
    const pushResult = await provider.putCategoriesFile(JSON.stringify(payload), remoteFile?.etag ?? null);

    if (!pushResult.success) {
        const latestRemote = await provider.getCategoriesFile();
        const retryResult = await provider.putCategoriesFile(JSON.stringify(payload), latestRemote?.etag ?? null);

        if (!retryResult.success) {
            throw new Error("Sync conflict: categories file changed concurrently, please retry");
        }
    }

    return { pulled: merge.toApplyLocally.length, pushed: merge.localOnlyCount, conflicts: merge.conflicts };
}

// Applies a remote recipe file that won against whatever's local (or is brand new locally),
// resolving its categoryUuid to this device's local category id.
async function applyRemoteRecipe(
    remoteRecipe: RecipeBackupModel,
    localId: number | undefined,
    categoryIdByUuid: Map<string, number>
) {
    const localCategoryId = (remoteRecipe.categoryUuid && categoryIdByUuid.get(remoteRecipe.categoryUuid)) || 0;
    await applySyncedRecipe(remoteRecipe, localId, localCategoryId);
}

let inFlightSync: Promise<SyncResult> | null = null;

export async function syncNow(provider: CloudProvider): Promise<SyncResult> {
    if (inFlightSync) {
        return await inFlightSync;
    }

    inFlightSync = runSync(provider);

    try {
        return await inFlightSync;
    } finally {
        inFlightSync = null;
    }
}

async function runSync(provider: CloudProvider): Promise<SyncResult> {
    const lastSyncedAt = await getSetting("LastSyncedAt", "");
    const deviceId = await getOrCreateDeviceId();

    const categoryResult = await syncCategories(provider, deviceId, lastSyncedAt);

    // Recipes reference categories by categoryUuid in the payload - resolve to this device's
    // local category id only after categories have just been applied above.
    const categoryIdByUuid = new Map(
        (await getAllCategoriesForSync()).filter(c => c.uuid).map(c => [c.uuid!, c.id])
    );

    const localRecipes = await getAllRecipesForSync();
    const localRecipesByUuid = new Map(localRecipes.filter(r => r.uuid).map(r => [r.uuid!, r]));

    let pulled = 0;
    let pushed = 0;
    let conflicts = categoryResult.conflicts;
    const settledUuids = new Set<string>();

    // Pull: only fetch a recipe file's content when its listed etag differs from the last one
    // we saw for that uuid - everything else is skipped without ever downloading it.
    const remoteFiles = await provider.listRecipeFiles();

    for (const fileMeta of remoteFiles) {
        const uuid = fileMeta.name.replace(/\.json$/, "");
        const cachedEtag = await getRecipeSyncEtag(uuid);

        if (cachedEtag === fileMeta.etag) {
            continue;
        }

        const remoteFile = await provider.getRecipeFile(uuid);
        if (!remoteFile) {
            continue; // disappeared between listing and fetch - pick it up on the next sync
        }

        const remoteRecipe: RecipeBackupModel = JSON.parse(remoteFile.content);
        const localRecipe = localRecipesByUuid.get(uuid);
        const decision = decideWinner(localRecipe, remoteRecipe, lastSyncedAt);

        if (decision.conflict) {
            conflicts++;
        }

        if (decision.winner === "remote") {
            await applyRemoteRecipe(remoteRecipe, localRecipe?.id, categoryIdByUuid);
            pulled++;
            settledUuids.add(uuid);
        }

        // Cache the etag either way: if local won, this recipe will be pushed below and
        // overwrite this exact version, so the If-Match on that push lines up correctly.
        await setRecipeSyncEtag(uuid, remoteFile.etag);
    }

    // Push: local recipes touched since the last sync that didn't just get overwritten above,
    // plus anything we've never actually confirmed exists in the remote /recipes layout yet -
    // "unchanged since lastSyncedAt" only means skip-safe once we know it was actually written
    // remotely (a cached etag). Without that second check, a lastSyncedAt left over from before
    // this per-file design existed (or any other reason the cache is empty) would make every
    // recipe look "already synced" and silently never get pushed.
    for (const recipe of localRecipes) {
        if (!recipe.uuid || !recipe.id || settledUuids.has(recipe.uuid)) {
            continue;
        }

        const cachedEtag = await getRecipeSyncEtag(recipe.uuid);

        if (effectiveTime(recipe) <= lastSyncedAt && cachedEtag !== undefined) {
            continue;
        }

        const payload = await prepareRecipeSyncPayload(recipe.id);
        if (!payload) {
            continue;
        }

        let putResult = await provider.putRecipeFile(recipe.uuid, JSON.stringify(payload), cachedEtag ?? null);

        if (!putResult.success) {
            // Someone else wrote this recipe's file since we last saw it - re-fetch, re-decide
            // the winner against the latest version, then retry the push once if we still win.
            const latestRemoteFile = await provider.getRecipeFile(recipe.uuid);

            if (latestRemoteFile) {
                const latestRemoteRecipe: RecipeBackupModel = JSON.parse(latestRemoteFile.content);
                const decision = decideWinner(recipe, latestRemoteRecipe, lastSyncedAt);

                if (decision.conflict) {
                    conflicts++;
                }

                if (decision.winner === "remote") {
                    await applyRemoteRecipe(latestRemoteRecipe, recipe.id, categoryIdByUuid);
                    await setRecipeSyncEtag(recipe.uuid, latestRemoteFile.etag);
                    pulled++;
                    continue;
                }
            }

            putResult = await provider.putRecipeFile(recipe.uuid, JSON.stringify(payload), latestRemoteFile?.etag ?? null);
        }

        if (putResult.success) {
            if (putResult.etag) {
                await setRecipeSyncEtag(recipe.uuid, putResult.etag);
            }
            pushed++;
        }
    }

    await saveSetting("LastSyncedAt", new Date().toISOString());
    await saveSetting("SyncNeedsReauth", "false");

    return {
        pulled: categoryResult.pulled + pulled,
        pushed: categoryResult.pushed + pushed,
        conflicts,
    };
}

export function getProvider(): CloudProvider {
    return (window as any).__testCloudProvider ?? new OneDriveProvider();
}

export type AutoSyncOutcome = "completed" | "reauth-required";

export async function autoSyncIfEnabled(): Promise<AutoSyncOutcome> {
    const cloudSyncEnabled = (await getSetting("EnableCloudSync", "false")) === "true";
    const autoSyncEnabled = (await getSetting("AutoSyncEnabled", "false")) === "true";

    if (!cloudSyncEnabled || !autoSyncEnabled) {
        return "completed";
    }

    const provider = getProvider();

    if (!(await provider.isConnected())) {
        return "completed";
    }

    if (!(await provider.hasSilentAccess())) {
        await saveSetting("SyncNeedsReauth", "true");
        return "reauth-required";
    }

    try {
        await syncNow(provider);
    } catch (error) {
        console.error("Automatic cloud sync failed", error);
    }

    return "completed";
}
