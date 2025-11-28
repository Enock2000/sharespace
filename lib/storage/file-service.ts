import { db } from "../database/schema";
import { File, FileVersion, Folder } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export const createFile = async (
    tenantId: string,
    folderId: string,
    userId: string,
    fileData: { name: string; size: number; mime_type: string; storage_key: string }
): Promise<File> => {
    const fileId = uuidv4();
    const now = Date.now();

    const newFile: File = {
        id: fileId,
        name: fileData.name,
        folder_id: folderId,
        tenant_id: tenantId,
        uploaded_by: userId,
        storage_key: fileData.storage_key,
        size: fileData.size,
        mime_type: fileData.mime_type,
        current_version: "1",
        created_at: now,
        updated_at: now,
        is_deleted: false,
    };

    const newVersion: FileVersion = {
        id: uuidv4(),
        file_id: fileId,
        version_number: 1,
        storage_key: fileData.storage_key,
        size: fileData.size,
        uploaded_by: userId,
        uploaded_at: now,
    };

    await db.set(`files/${fileId}`, newFile);
    await db.set(`file_versions/${newVersion.id}`, newVersion);

    return newFile;
};

export const createFolder = async (
    tenantId: string,
    parentId: string | null,
    userId: string,
    name: string
): Promise<Folder> => {
    const folderId = uuidv4();
    const now = Date.now();

    const newFolder: Folder = {
        id: folderId,
        name,
        parent_id: parentId,
        tenant_id: tenantId,
        created_by: userId,
        created_at: now,
        updated_at: now,
    };

    await db.set(`folders/${folderId}`, newFolder);
    return newFolder;
};

export const getFolderContents = async (folderId: string | null, tenantId: string) => {
    console.log(`[getFolderContents] Requesting for tenant: ${tenantId}, folder: ${folderId}`);
    files,
        folders
};
};
