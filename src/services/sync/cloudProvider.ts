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

export interface CloudProvider {
    readonly id: string;
    isConnected(): Promise<boolean>;
    hasSilentAccess(): Promise<boolean>;
    connect(): Promise<CloudProviderAccount>;
    disconnect(): Promise<void>;

    getCategoriesFile(): Promise<RemoteFile | null>;
    putCategoriesFile(content: string, expectedEtag: string | null): Promise<PutResult>;

    listRecipeFiles(): Promise<RemoteFileMeta[]>;
    getRecipeFile(uuid: string): Promise<RemoteFile | null>;
    putRecipeFile(uuid: string, content: string, expectedEtag: string | null): Promise<PutResult>;
}
