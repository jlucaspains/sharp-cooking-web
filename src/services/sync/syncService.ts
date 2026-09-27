import { BackupModel, RecipeBackupModel } from "../../pages/recipe/backupModel";
import {
    getSetting,
    saveSetting,
    getAllCategoriesForSync,
    getAllRecipesForSync,
    applySyncedCategory,
    applySyncedRecipe,
    prepareSyncSnapshot,
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

// Decides, per uuid, whether the remote version of an entity should overwrite the local one.
// Last-write-wins by effective time (changedOn, or deletedOn if that's later) - a delete newer
// than the other side's edit wins, an edit newer than the other side's delete resurrects it.
function mergeEntities<T extends SyncEntity>(local: T[], remote: T[], lastSyncedAt: string) {
    const localByUuid = new Map(local.filter(e => e.uuid).map(e => [e.uuid!, e]));
    const remoteByUuid = new Map(remote.filter(e => e.uuid).map(e => [e.uuid!, e]));

    const toApplyLocally: Array<{ remote: T; localId: number | undefined }> = [];
    let localOnlyCount = 0;
    let conflicts = 0;

    for (const [uuid, remoteEntity] of remoteByUuid) {
        const localEntity = localByUuid.get(uuid);

        if (!localEntity) {
            toApplyLocally.push({ remote: remoteEntity, localId: undefined });
            continue;
        }

        const localTime = effectiveTime(localEntity);
        const remoteTime = effectiveTime(remoteEntity);
        const bothChangedSinceLastSync = localTime > lastSyncedAt && remoteTime > lastSyncedAt;

        if (bothChangedSinceLastSync && localTime !== remoteTime) {
            conflicts++;
        }

        if (remoteTime > localTime) {
            toApplyLocally.push({ remote: remoteEntity, localId: localEntity.id });
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

export async function syncNow(provider: CloudProvider): Promise<SyncResult> {
    const lastSyncedAt = await getSetting("LastSyncedAt", "");
    const deviceId = await getOrCreateDeviceId();

    const localCategories = await getAllCategoriesForSync();
    const localRecipes = await getAllRecipesForSync();

    const remoteFile = await provider.getRemoteFile();
    const remoteSnapshot: BackupModel | null = remoteFile ? JSON.parse(remoteFile.content) : null;

    const categoryMerge = mergeEntities(localCategories, remoteSnapshot?.categories ?? [], lastSyncedAt);
    for (const { remote, localId } of categoryMerge.toApplyLocally) {
        await applySyncedCategory(remote, localId);
    }

    // Recipes reference categories by categoryUuid in the payload - resolve to this device's
    // local category id after categories have been applied above.
    const categoryIdByUuid = new Map(
        (await getAllCategoriesForSync()).filter(c => c.uuid).map(c => [c.uuid!, c.id])
    );

    const recipeMerge = mergeEntities<RecipeBackupModel & SyncEntity>(
        localRecipes as Array<RecipeBackupModel & SyncEntity>,
        (remoteSnapshot?.recipes ?? []) as Array<RecipeBackupModel & SyncEntity>,
        lastSyncedAt
    );

    for (const { remote, localId } of recipeMerge.toApplyLocally) {
        const localCategoryId = (remote.categoryUuid && categoryIdByUuid.get(remote.categoryUuid)) || 0;
        await applySyncedRecipe(remote, localId, localCategoryId);
    }

    const snapshot = await prepareSyncSnapshot(deviceId);
    const pushResult = await provider.putRemoteFile(JSON.stringify(snapshot), remoteFile?.etag ?? null);

    if (!pushResult.success) {
        // Someone else wrote to the remote file between our download and upload - retry once
        // against the latest version. A repeated failure surfaces as an error to the caller.
        const latestRemote = await provider.getRemoteFile();
        const retryResult = await provider.putRemoteFile(JSON.stringify(snapshot), latestRemote?.etag ?? null);

        if (!retryResult.success) {
            throw new Error("Sync conflict: remote file changed concurrently, please retry");
        }
    }

    await saveSetting("LastSyncedAt", new Date().toISOString());

    return {
        pulled: categoryMerge.toApplyLocally.length + recipeMerge.toApplyLocally.length,
        pushed: categoryMerge.localOnlyCount + recipeMerge.localOnlyCount,
        conflicts: categoryMerge.conflicts + recipeMerge.conflicts,
    };
}

// Called on app load and when the connection comes back online. No-ops unless the user has
// both opted into the cloud sync preview feature and turned on the "auto sync" toggle, and
// stays silent on failure (e.g. offline) rather than surfacing a toast for a background sync
// nobody asked to watch.
export async function autoSyncIfEnabled(): Promise<void> {
    const cloudSyncEnabled = (await getSetting("EnableCloudSync", "false")) === "true";
    const autoSyncEnabled = (await getSetting("AutoSyncEnabled", "false")) === "true";

    if (!cloudSyncEnabled || !autoSyncEnabled) {
        return;
    }

    const provider = new OneDriveProvider();

    if (!(await provider.isConnected())) {
        return;
    }

    try {
        await syncNow(provider);
    } catch (error) {
        console.error("Automatic cloud sync failed", error);
    }
}
