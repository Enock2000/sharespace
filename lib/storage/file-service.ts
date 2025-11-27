import { db } from "../database/schema";
import { File, FileVersion, Folder } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export const createFile = async (
    tenantId: string,
    folderId: string,
    ownerId: string,
    fileData: { name: string; size: number; mime_type: string; storage_key: string }
): Promise<File> => {
    const fileId = uuidv4();
    const now = Date.now();

    const newFile: File = {
        id: fileId,
        name: fileData.name,
        folder_id: folderId,
        tenant_id: tenantId,
        owner_id: ownerId,
        size: fileData.size,
        mime_type: fileData.mime_type,
        current_version: 1,
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
        uploaded_by: ownerId,
        uploaded_at: now,
    };

    await db.set(`files/${fileId}`, newFile);
    await db.set(`file_versions/${newVersion.id}`, newVersion);

    // Update folder file count or list (denormalization if needed)

    return newFile;
};

export const createFolder = async (
    tenantId: string,
    parentId: string | null,
    ownerId: string,
    name: string
): Promise<Folder> => {
    const folderId = uuidv4();
    const now = Date.now();

    // Get parent path
    let path: string[] = [];
    if (parentId) {
        const parent = await db.get<Folder>(`folders/${parentId}`);
        if (parent) {
            path = [...parent.path, parentId];
        }
    }

    const newFolder: Folder = {
        id: folderId,
        name,
        parent_id: parentId,
        tenant_id: tenantId,
        owner_id: ownerId,
        created_at: now,
        path,
    };

    await db.set(`folders/${folderId}`, newFolder);
    return newFolder;
};

export const getFolderContents = async (folderId: string | null, tenantId: string) => {
    // This is inefficient in Realtime DB without indexing
    // In a real app we would store a list of children in the folder object
    // For MVP we can query by folder_id

    const files = await db.query<File>("files", "folder_id", folderId || "root");
    const folders = await db.query<Folder>("folders", "parent_id", folderId || "root");

    // Filter by tenant_id to be safe (though folder_id should be unique enough, but good for security)
    // Also filter out deleted files
    return {
        files: files.filter(f => f.tenant_id === tenantId && !f.is_deleted),
        folders: folders.filter(f => f.tenant_id === tenantId)
    };
};
