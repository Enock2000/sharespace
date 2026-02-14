import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, Folder, DeletedItem } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";

// POST - Restore item from trash
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const destinationFolderId = searchParams.get("destination"); // Optional new location

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get the deleted item
        const deletedItem = await db.get<DeletedItem>(`deleted_items/${params.id}`);
        if (!deletedItem || deletedItem.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Item not found in trash" }, { status: 404 });
        }

        // Determine restore location
        const restoreLocation = destinationFolderId || deletedItem.original_path;

        if (deletedItem.item_type === "file") {
            // Restore file
            const file = await db.get<File>(`files/${deletedItem.item_id}`);
            if (file) {
                await db.update(`files/${deletedItem.item_id}`, {
                    is_deleted: false,
                    folder_id: restoreLocation === "null" ? null : restoreLocation,
                    updated_at: Date.now()
                });
            }
        } else {
            // Restore folder
            const folder = await db.get<Folder>(`folders/${deletedItem.item_id}`);
            if (folder) {
                await db.update(`folders/${deletedItem.item_id}`, {
                    parent_id: restoreLocation === "null" ? null : restoreLocation,
                    updated_at: Date.now()
                });

                // Also restore any files/folders that were in this folder
                // This is a simplified version - full implementation would restore nested items
            }
        }

        // Remove from deleted_items
        await db.remove(`deleted_items/${params.id}`);

        await logEvent(
            user.tenant_id,
            userId,
            "restore_from_trash",
            deletedItem.item_type,
            deletedItem.item_id,
            { name: deletedItem.item_name, restored_to: restoreLocation }
        );

        return NextResponse.json({
            success: true,
            message: `${deletedItem.item_name} restored successfully`,
            restored_to: restoreLocation
        });
    } catch (error: any) {
        console.error("Restore from trash error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
