import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, DeletedItem } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";

const TRASH_RETENTION_DAYS = 30;

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(`[DELETE FILE] Request for fileId: ${params.id}, userId: ${userId}`);

    if (!userId) {
        console.log("[DELETE FILE] Missing userId");
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const file = await db.get<File>(`files/${params.id}`);
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        if (file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Soft delete
        await db.update(`files/${params.id}`, { is_deleted: true });

        // Create trash record for recovery
        const deletedItem: DeletedItem = {
            id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            item_type: "file",
            item_id: file.id,
            item_name: file.name,
            original_path: file.folder_id || "null",
            tenant_id: file.tenant_id,
            deleted_by: userId,
            deleted_at: Date.now(),
            expires_at: Date.now() + (TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000),
            size: file.size,
            mime_type: file.mime_type
        };

        await db.set(`deleted_items/${deletedItem.id}`, deletedItem);

        await logEvent(
            user.tenant_id,
            userId,
            "delete_file",
            "file",
            file.id,
            { name: file.name }
        );

        return NextResponse.json({ success: true, trash_id: deletedItem.id });
    } catch (error: any) {
        console.error("Delete file error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
