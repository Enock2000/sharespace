import { getB2Client, B2_BUCKET_ID } from "../backblaze-config";
import { v4 as uuidv4 } from "uuid";

export const getUploadUrl = async () => {
    try {
        console.log(`[B2] Getting upload URL for bucket: ${B2_BUCKET_ID}`);
        const b2 = await getB2Client();
        const response = await b2.getUploadUrl({
            bucketId: B2_BUCKET_ID,
        });
        console.log(`[B2] Upload URL obtained successfully`);
        return response.data;
    } catch (error: any) {
        console.error("[B2] Failed to get upload URL:", error.message);
        console.error("[B2] Error details:", error);
        throw error;
    }
};

export const getDownloadUrl = async (fileKey: string, validDurationInSeconds: number = 3600) => {
    const b2 = await getB2Client();
    // B2 doesn't have a direct "get signed url" method in the node sdk for private buckets in the same way S3 does
    // But we can generate an authorization token for the specific file
    const response = await b2.getDownloadAuthorization({
        bucketId: B2_BUCKET_ID,
        fileNamePrefix: fileKey,
        validDurationInSeconds,
    });

    const downloadAuthToken = response.data.authorizationToken;
    const downloadUrl = response.data.downloadUrl; // usually https://f002.backblazeb2.com

    // Construct the URL
    // Format: https://f002.backblazeb2.com/file/bucket-name/fileKey?Authorization=token
    // We need the bucket name, which we can get or store in config
    // For now assuming we have it in env or can get it

    // A safer way for private files is to use the downloadAuthToken
    return {
        downloadUrl,
        authorizationToken: downloadAuthToken,
        fileName: fileKey
    };
};

export const deleteFile = async (fileId: string, fileName: string) => {
    const b2 = await getB2Client();
    await b2.deleteFileVersion({
        fileId,
        fileName,
    });
};
