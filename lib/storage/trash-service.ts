import { db } from "@/lib/database/schema";
import { DeletedItem, File, FileVersion } from "@/types/database";
import { backblazeService } from "@/lib/storage/backblaze";

export const purgeExpiredTrash = async (retentionDays: number = 30): Promise<{ deletedCount: number; errors: any[] }> => {
    const now = Date.now();
    const deletedItemsData = await db.get<Record<string, DeletedItem>>("deleted_items");
    if (!deletedItemsData) return { deletedCount: 0, errors: [] };

    const expiredItems = Object.values(deletedItemsData).filter(item => item.expires_at < now);
    let deletedCount = 0;
    const errors: any[] = [];

    for (const item of expiredItems) {
        try {
            if (item.item_type === "file") {
                await permanentlyDeleteFile(item.item_id);
            } else if (item.item_type === "folder") {
                // For folders, we currently just remove the record.
                // Ideally we should recursively delete children, but typically
                // children are deleted (moved to trash) when the folder is.
                await db.remove(`folders/${item.item_id}`);
            }

            // Remove from trash
            await db.remove(`deleted_items/${item.id}`);
            deletedCount++;
        } catch (error) {
            console.error(`Failed to purge item ${item.id}:`, error);
            errors.push({ itemId: item.id, error });
        }
    }

    return { deletedCount, errors };
};

const permanentlyDeleteFile = async (fileId: string) => {
    // 1. Get file details
    const file = await db.get<File>(`files/${fileId}`);

    // 2. Get all versions
    const allVersionsData = await db.get<Record<string, FileVersion>>("file_versions");
    const fileVersions = allVersionsData
        ? Object.values(allVersionsData).filter(v => v.file_id === fileId)
        : [];

    // 3. Collect all storage keys used by this file and its versions
    const storageKeysToDelete = new Set<string>();
    if (file && file.storage_key) storageKeysToDelete.add(file.storage_key);
    fileVersions.forEach(v => storageKeysToDelete.add(v.storage_key));

    // 4. Safely delete from B2 if not used by others
    for (const key of Array.from(storageKeysToDelete)) {
        if (await isStorageKeyUsedByOthers(key, fileId)) {
            console.log(`Skipping B2 delete for ${key}, used by other files`);
            continue;
        }

        try {
            // Find a version or the file that uses this key to get the B2 file name
            // (B2 deleteFileVersion requires both ID and Name)
            let b2FileName = file && file.storage_key === key ? file.b2_file_name : null;
            if (!b2FileName) {
                const v = fileVersions.find(ver => ver.storage_key === key);
                if (v) b2FileName = v.b2_file_name;
            }

            if (b2FileName) {
                await backblazeService.deleteFileVersion(key, b2FileName);
            } else {
                console.warn(`Could not find B2 file name for key ${key}, skipping B2 delete`);
            }
        } catch (e) {
            console.error(`B2 delete failed for key ${key}`, e);
            // We continue deleting DB records even if B2 fails? 
            // Better to leave orphan in B2 than broken DB references, 
            // but ideally we'd retry. For now, log and proceed.
        }
    }

    // 5. Delete DB records
    if (file) await db.remove(`files/${fileId}`);
    for (const v of fileVersions) {
        await db.remove(`file_versions/${v.id}`);
    }
}

const isStorageKeyUsedByOthers = async (storageKey: string, excludeFileId: string): Promise<boolean> => {
    const allFilesData = await db.get<Record<string, File>>(`files`);
    if (!allFilesData) return false;

    // Check if any NON-DELETED file uses this key. 
    // Also check other DELETED files? If another deleted file uses it, we shouldn't delete yet?
    // Yes, if another file (trash or not) uses it, we preserve it.
    // So we just check id != excludeFileId

    return Object.values(allFilesData).some(f => f.storage_key === storageKey && f.id !== excludeFileId);
}
