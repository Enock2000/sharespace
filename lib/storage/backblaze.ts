import B2 from "backblaze-b2";

// Configuration from environment variables
const CONFIG = {
    applicationKeyId: process.env.B2_KEY_ID || "",
    applicationKey: process.env.B2_APPLICATION_KEY || "",
    bucketId: process.env.B2_BUCKET_ID || "",
    bucketName: process.env.B2_BUCKET_NAME || ""
};

class BackblazeService {
    private b2: any;
    private authorized: boolean = false;
    private authorizedAt: number = 0;
    private downloadUrl: string = "";
    private apiUrl: string = "";
    private recommendedPartSize: number = 10 * 1024 * 1024; // Default 10MB
    // Re-authorize every 23 hours (B2 tokens expire after 24h)
    private static AUTH_TTL_MS = 23 * 60 * 60 * 1000;

    constructor() {
        this.b2 = new B2({
            applicationKeyId: CONFIG.applicationKeyId,
            applicationKey: CONFIG.applicationKey,
        });
    }

    private isAuthExpired(): boolean {
        return !this.authorized || (Date.now() - this.authorizedAt > BackblazeService.AUTH_TTL_MS);
    }

    async authorize() {
        if (this.isAuthExpired()) {
            console.log("[BackblazeService] Authorizing with B2...");
            try {
                const response = await this.b2.authorize();
                this.downloadUrl = response.data.downloadUrl;
                this.apiUrl = response.data.apiUrl;
                this.recommendedPartSize = response.data.recommendedPartSize || 10 * 1024 * 1024;
                this.authorized = true;
                this.authorizedAt = Date.now();
                console.log("[BackblazeService] Authorization successful.");
            } catch (error: any) {
                this.authorized = false;
                this.authorizedAt = 0;
                console.error("[BackblazeService] Authorization failed:", error.message);
                throw error;
            }
        }
    }

    /** Force re-authorization on next call */
    resetAuth() {
        this.authorized = false;
        this.authorizedAt = 0;
    }

    async getUploadUrl() {
        try {
            await this.authorize();
            const response = await this.b2.getUploadUrl({
                bucketId: CONFIG.bucketId,
            });
            return response.data;
        } catch (error: any) {
            console.warn("[BackblazeService] getUploadUrl failed, retrying with fresh auth...", error.message);
            this.resetAuth();
            await this.authorize();
            const response = await this.b2.getUploadUrl({
                bucketId: CONFIG.bucketId,
            });
            return response.data;
        }
    }

    async deleteFileVersion(fileId: string, fileName: string) {
        await this.authorize();
        const response = await this.b2.deleteFileVersion({
            fileId: fileId,
            fileName: fileName,
        });
        return response.data;
    }

    async getDownloadUrl(fileName: string) {
        try {
            await this.authorize();
            // B2 requires the DECODED file name for authorization prefix
            const decodedName = decodeURIComponent(fileName);
            
            const response = await this.b2.getDownloadAuthorization({
                bucketId: CONFIG.bucketId,
                fileNamePrefix: decodedName,
                validDurationInSeconds: 3600,
            });

            const { authorizationToken } = response.data;
            // But the download URL requires the ENCODED file name in the path
            return `${this.downloadUrl}/file/${CONFIG.bucketName}/${fileName}?Authorization=${encodeURIComponent(authorizationToken)}`;
        } catch (error: any) {
            console.warn("[BackblazeService] getDownloadUrl failed, retrying with fresh auth...", error.message);
            this.resetAuth();
            await this.authorize();
            
            const decodedName = decodeURIComponent(fileName);
            const response = await this.b2.getDownloadAuthorization({
                bucketId: CONFIG.bucketId,
                fileNamePrefix: decodedName,
                validDurationInSeconds: 3600,
            });

            const { authorizationToken } = response.data;
            return `${this.downloadUrl}/file/${CONFIG.bucketName}/${fileName}?Authorization=${encodeURIComponent(authorizationToken)}`;
        }
    }

    // ============ Large File API Methods ============

    async startLargeFile(fileName: string, contentType: string) {
        await this.authorize();
        const response = await this.b2.startLargeFile({
            bucketId: CONFIG.bucketId,
            fileName: fileName,
            contentType: contentType || "application/octet-stream",
        });
        return response.data; // Returns { fileId, fileName, ... }
    }

    async getUploadPartUrl(fileId: string) {
        await this.authorize();
        const response = await this.b2.getUploadPartUrl({
            fileId: fileId,
        });
        return response.data; // Returns { uploadUrl, authorizationToken }
    }

    async finishLargeFile(fileId: string, partSha1Array: string[]) {
        await this.authorize();
        const response = await this.b2.finishLargeFile({
            fileId: fileId,
            partSha1Array: partSha1Array,
        });
        return response.data;
    }

    async cancelLargeFile(fileId: string) {
        await this.authorize();
        const response = await this.b2.cancelLargeFile({
            fileId: fileId,
        });
        return response.data;
    }

    async listUnfinishedLargeFiles() {
        await this.authorize();
        const response = await this.b2.listUnfinishedLargeFiles({
            bucketId: CONFIG.bucketId,
        });
        return response.data;
    }

    getRecommendedPartSize() {
        return this.recommendedPartSize;
    }

    getBucketId() {
        return CONFIG.bucketId;
    }

    getBucketName() {
        return CONFIG.bucketName;
    }
}

export const backblazeService = new BackblazeService();
