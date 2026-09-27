export interface RemoteFile {
    content: string;
    etag: string;
}

export interface CloudProviderAccount {
    displayName: string;
}

// Common surface every cloud storage backend (OneDrive, others later) must implement so
// syncService can drive them the same way. Only what sync needs: connect/disconnect, and
// read/write of a single JSON snapshot file with optimistic concurrency via etag.
export interface CloudProvider {
    readonly id: string;
    isConnected(): Promise<boolean>;
    connect(): Promise<CloudProviderAccount>;
    disconnect(): Promise<void>;
    getRemoteFile(): Promise<RemoteFile | null>;
    putRemoteFile(content: string, expectedEtag: string | null): Promise<{ success: boolean; etag?: string }>;
}
