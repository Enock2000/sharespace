import B2 from "backblaze-b2";

// Hardcoded configuration as requested
const CONFIG = {
    applicationKeyId: "005b3c970d8861d0000000002",
    applicationKey: "K005LedBsyGZVJKjx2YJf6MjQaE81+U",
    bucketId: "db63dc494790cd9898a6011d",
    bucketName: "oraninve"
};

class BackblazeService {
    private b2: any;
    private authorized: boolean = false;
    private downloadUrl: string = "";
    private recommendedPartSize: number = 10 * 1024 * 1024; // Default 10MB

    constructor() {
        this.b2 = new B2({
            applicationKeyId: CONFIG.applicationKeyId,
            applicationKey: CONFIG.applicationKey,
        });
    }

    async authorize() {
        if (!this.authorized) {
            const response = await this.b2.authorize();
            this.downloadUrl = response.data.downloadUrl;
            this.recommendedPartSize = response.data.recommendedPartSize || 10 * 1024 * 1024;
            this.authorized = true;
        }
    }

    async getUploadUrl() {
        await this.authorize();
        const response = await this.b2.getUploadUrl({
            bucketId: CONFIG.bucketId,
        });
        return response.data;
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
        await this.authorize();
        const response = await this.b2.getDownloadAuthorization({
            bucketId: CONFIG.bucketId,
            fileNamePrefix: fileName,
            validDurationInSeconds: 3600,
        });

        const { authorizationToken } = response.data;
        const encodedFileName = encodeURIComponent(fileName);
        return `${this.downloadUrl}/file/${CONFIG.bucketName}/${encodedFileName}?Authorization=${authorizationToken}`;
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
