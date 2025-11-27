declare module 'backblaze-b2' {
    export default class B2 {
        constructor(config: {
            applicationKeyId: string;
            applicationKey: string;
        });

        authorize(): Promise<any>;

        getUploadUrl(params: {
            bucketId: string;
        }): Promise<{
            data: {
                uploadUrl: string;
                authorizationToken: string;
            };
        }>;

        getDownloadAuthorization(params: {
            bucketId: string;
            fileNamePrefix: string;
            validDurationInSeconds: number;
        }): Promise<{
            data: {
                authorizationToken: string;
                downloadUrl: string;
            };
        }>;

        deleteFileVersion(params: {
            fileId: string;
            fileName: string;
        }): Promise<any>;
    }
}
