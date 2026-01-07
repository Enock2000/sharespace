import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, Folder, DeletedItem } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";

const TRASH_RETENTION_DAYS = 30;

// GET - List all items in trash
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all deleted items for this tenant
        const deletedItemsMap = await db.get<Record<string, DeletedItem>>(`deleted_items`) || {};
        const tenantDeletedItems = Object.values(deletedItemsMap)
            .filter(item => item.tenant_id === user.tenant_id)
            .sort((a, b) => b.deleted_at - a.deleted_at);

        // Calculate days remaining for each item
        const itemsWithDays = tenantDeletedItems.map(item => ({
            ...item,
            days_remaining: Math.max(0, Math.ceil((item.expires_at - Date.now()) / (1000 * 60 * 60 * 24)))
        }));

        return NextResponse.json({ items: itemsWithDays });
    } catch (error: any) {
        console.error("Get trash error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Permanently delete or empty trash
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("itemId"); // Optional - if not provided, empty all trash

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only admins and owners can permanently delete
        if (!["owner", "admin", "super_admin", "platform_admin"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const deletedItemsMap = await db.get<Record<string, DeletedItem>>(`deleted_items`) || {};

        if (itemId) {
            // Delete specific item
            const item = deletedItemsMap[itemId];
            if (!item || item.tenant_id !== user.tenant_id) {
                return NextResponse.json({ error: "Item not found" }, { status: 404 });
            }

            // Permanently delete from storage (B2) would go here
            // For now, just remove from deleted_items
            await db.remove(`deleted_items/${itemId}`);

            await logEvent(user.tenant_id, userId, "permanent_delete", item.item_type, item.item_id, {
                name: item.item_name
            });

            return NextResponse.json({ success: true, message: "Item permanently deleted" });
        } else {
            // Empty all trash for tenant
            const tenantItems = Object.entries(deletedItemsMap)
                .filter(([_, item]) => item.tenant_id === user.tenant_id);

            for (const [id, _] of tenantItems) {
                await db.remove(`deleted_items/${id}`);
            }

            await logEvent(user.tenant_id, userId, "empty_trash", "trash", "all", {
                count: tenantItems.length
            });

            return NextResponse.json({ success: true, message: `Permanently deleted ${tenantItems.length} items` });
        }
    } catch (error: any) {
        console.error("Delete trash error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
