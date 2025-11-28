import { db } from "../database/schema";
import { File, FileVersion, Folder } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export const createFile = async (
    tenantId: string,
    folderId: string | null,
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

    // Get all files and folders for this tenant
    const allFilesData = await db.get(`files`);
    const allFoldersData = await db.get(`folders`);

    // Convert Firebase data to arrays
    const allFiles: File[] = allFilesData && typeof allFilesData === 'object'
        ? Object.values(allFilesData)
        : [];
    const allFolders: Folder[] = allFoldersData && typeof allFoldersData === 'object'
        ? Object.values(allFoldersData)
        : [];

    console.log(`[getFolderContents] Total folders in DB: ${allFolders.length}`);
    if (allFolders.length > 0) {
        console.log(`[getFolderContents] Sample folder tenant: ${allFolders[0].tenant_id}`);
        console.log(`[getFolderContents] Sample folder parent: ${allFolders[0].parent_id}`);
    }

    // Filter by tenant and parent folder
    // NOTE: Firebase Realtime DB drops null values, so parent_id/folder_id might be undefined
    // We need to treat undefined, null, and "root" all as root-level items
    const targetParent = folderId || null;

    const files = allFiles.filter(f => {
        const tenantMatch = f.tenant_id === tenantId;
        const isDeleted = f.is_deleted;
        // Treat undefined, null, and "root" as root folder
        const folderMatch = (f.folder_id === targetParent) ||
            (!f.folder_id && !targetParent) ||
            (f.folder_id === "root" && !targetParent);
        return tenantMatch && !isDeleted && folderMatch;
    });

    const folders = allFolders.filter(f => {
        const tenantMatch = f.tenant_id === tenantId;
        // Treat undefined and null as root folder
        const parentMatch = (f.parent_id === targetParent) ||
            (!f.parent_id && !targetParent);
        return tenantMatch && parentMatch;
    });

    console.log(`[getFolderContents] Returning ${folders.length} folders and ${files.length} files`);

    return {
        files,
        folders
    };
};
