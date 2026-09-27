export interface RemoteFile {
    content: string;
    etag: string;
}

export interface RemoteFileMeta {
    name: string;
    etag: string;
    lastModifiedDateTime: string;
}

export interface PutResult {
    success: boolean;
    etag?: string;
}

export interface CloudProviderAccount {
    displayName: string;
}

// Common surface every cloud storage backend (OneDrive, others later) must implement so
// syncService can drive them the same way. Categories are small and rarely change, so they
// still sync as one shared file. Recipes sync as individual files (one per uuid) so a sync
// only has to transfer the ones that actually changed - `listRecipeFiles()` returns metadata
// only (no content), used to decide which files are worth downloading at all.
export interface CloudProvider {
    readonly id: string;
    isConnected(): Promise<boolean>;
    connect(): Promise<CloudProviderAccount>;
    disconnect(): Promise<void>;

    getCategoriesFile(): Promise<RemoteFile | null>;
    putCategoriesFile(content: string, expectedEtag: string | null): Promise<PutResult>;

    listRecipeFiles(): Promise<RemoteFileMeta[]>;
    getRecipeFile(uuid: string): Promise<RemoteFile | null>;
    putRecipeFile(uuid: string, content: string, expectedEtag: string | null): Promise<PutResult>;
}
