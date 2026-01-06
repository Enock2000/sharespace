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
            validDurationInSeconds: 3600, // 1 hour
        });

        const { authorizationToken } = response.data;
        // Use the download URL from authorize
        // Properly encode the filename for URL
        const encodedFileName = encodeURIComponent(fileName);
        return `${this.downloadUrl}/file/${CONFIG.bucketName}/${encodedFileName}?Authorization=${authorizationToken}`;
    }

    // Get a direct download URL without authorization (for private buckets, this won't work)
    getPublicUrl(fileName: string) {
        const encodedFileName = encodeURIComponent(fileName);
        return `https://f005.backblazeb2.com/file/${CONFIG.bucketName}/${encodedFileName}`;
    }

    getBucketId() {
        return CONFIG.bucketId;
    }

    getBucketName() {
        return CONFIG.bucketName;
    }
}

export const backblazeService = new BackblazeService();
