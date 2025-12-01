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

    constructor() {
        this.b2 = new B2({
            applicationKeyId: CONFIG.applicationKeyId,
            applicationKey: CONFIG.applicationKey,
        });
    }

    async authorize() {
        if (!this.authorized) {
            await this.b2.authorize();
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

    getBucketId() {
        return CONFIG.bucketId;
    }
}

export const backblazeService = new BackblazeService();
