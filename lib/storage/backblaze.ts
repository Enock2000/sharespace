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
