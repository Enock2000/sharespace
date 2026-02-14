import { db } from "../database/schema";
import { File, FileVersion, Folder, Tenant } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export const createFile = async (
    tenantId: string,
    folderId: string | null,
    userId: string,
    fileData: { name: string; size: number; mime_type: string; storage_key: string; b2_file_name?: string }
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
        b2_file_name: fileData.b2_file_name,
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
        b2_file_name: fileData.b2_file_name,
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

export const getFileVersions = async (fileId: string): Promise<FileVersion[]> => {
    const allVersionsData = await db.get(`file_versions`);
    const allVersions: FileVersion[] = allVersionsData && typeof allVersionsData === 'object'
        ? Object.values(allVersionsData)
        : [];

    return allVersions
        .filter(v => v.file_id === fileId)
        .sort((a, b) => b.version_number - a.version_number);
};

export const addFileVersion = async (
    fileId: string,
    fileData: { size: number; storage_key: string; b2_file_name?: string; userId: string }
): Promise<FileVersion> => {
    const versions = await getFileVersions(fileId);
    const latestVersion = versions.length > 0 ? versions[0].version_number : 0;
    const nextVersion = latestVersion + 1;
    const now = Date.now();

    const newVersion: FileVersion = {
        id: uuidv4(),
        file_id: fileId,
        version_number: nextVersion,
        storage_key: fileData.storage_key,
        b2_file_name: fileData.b2_file_name,
        size: fileData.size,
        uploaded_by: fileData.userId,
        uploaded_at: now,
    };

    await db.set(`file_versions/${newVersion.id}`, newVersion);

    // Update main file record
    const file = await db.get<File>(`files/${fileId}`);
    if (file) {
        await db.set(`files/${fileId}`, {
            ...file,
            current_version: nextVersion.toString(),
            size: fileData.size,
            storage_key: fileData.storage_key,
            b2_file_name: fileData.b2_file_name,
            updated_at: now,
            updated_by: fileData.userId // Assuming we might want to track who updated it
        });
    }

    return newVersion;
};

export const findFile = async (
    tenantId: string,
    folderId: string | null,
    name: string
): Promise<File | null> => {
    const allFilesData = await db.get(`files`);
    const allFiles: File[] = allFilesData && typeof allFilesData === 'object'
        ? Object.values(allFilesData)
        : [];

    const targetParent = folderId || null;

    return allFiles.find(f => {
        const tenantMatch = f.tenant_id === tenantId;
        const nameMatch = f.name === name;
        const notDeleted = !f.is_deleted;
        // Treat undefined, null, and "root" as root folder
        const folderMatch = (f.folder_id === targetParent) ||
            (!f.folder_id && !targetParent) ||
            (f.folder_id === "root" && !targetParent);

        return tenantMatch && nameMatch && notDeleted && folderMatch;
    }) || null;
};

export const moveFile = async (
    fileId: string,
    destinationFolderId: string | null,
    userId: string
): Promise<File | null> => {
    const file = await db.get<File>(`files/${fileId}`);
    if (!file) return null;

    const updatedFile = {
        ...file,
        folder_id: destinationFolderId,
        updated_at: Date.now(),
        // updated_by: userId 
    };

    await db.set(`files/${fileId}`, updatedFile);
    return updatedFile;
};

export const copyFile = async (
    fileId: string,
    destinationFolderId: string | null,
    userId: string
): Promise<File | null> => {
    const file = await db.get<File>(`files/${fileId}`);
    if (!file) return null;

    // Optional: Check for name collision in destination and rename?
    // For now, allow same name (frontend can handle or DB allows it as we filter by folder)
    // Actually our findFile logic allows finding by name.
    // If we want unique names, we should check.
    // Let's just create copy for now.

    // Create new file record
    const newFileId = uuidv4();
    const now = Date.now();

    // Copy content
    const newFile: File = {
        ...file,
        id: newFileId,
        folder_id: destinationFolderId,
        uploaded_by: userId, // The copier becomes the owner effectively? Or keep original? usually new owner.
        created_at: now,
        updated_at: now,
        current_version: "1" // Reset version or keep? 
        // If we copy, it's a new file. Versions are not linked history usually.
        // So we start at v1.
    };

    // Create initial version for the copy (same content)
    const newVersion: FileVersion = {
        id: uuidv4(),
        file_id: newFileId,
        version_number: 1,
        storage_key: file.storage_key, // Same B2 file
        b2_file_name: file.b2_file_name,
        size: file.size,
        uploaded_by: userId,
        uploaded_at: now,
    };

    await db.set(`files/${newFileId}`, newFile);
    await db.set(`file_versions/${newVersion.id}`, newVersion);

    return newFile;
};

// ========== STORAGE QUOTA ==========
export const getTenantStorageUsage = async (tenantId: string): Promise<number> => {
    const allFilesData = await db.get<Record<string, File>>(`files`);
    if (!allFilesData) return 0;

    // Filter for tenant and non-deleted files
    const files = Object.values(allFilesData).filter(f => f.tenant_id === tenantId && !f.is_deleted);
    return files.reduce((total, file) => total + (file.size || 0), 0);
};

export const checkStorageQuota = async (tenantId: string, addedSize: number): Promise<boolean> => {
    const tenant = await db.get<Tenant>(`tenants/${tenantId}`);
    if (!tenant) return false;

    const currentUsage = await getTenantStorageUsage(tenantId);
    return (currentUsage + addedSize) <= tenant.storage_quota;
};
