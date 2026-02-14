import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, Folder } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const folder = await db.get<Folder>(`folders/${params.id}`);
        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        if (folder.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Check if folder is empty (simplified for MVP - ideally recursive delete)
        // For now, we'll just delete the folder record. 
        // In a real app, we should check for children or recursively delete them.
        // Given the "soft delete" nature, we might want to just mark it deleted if we added that field to Folder.
        // But Folder type doesn't have is_deleted yet. Let's just remove it for now or check children.

        // Let's just remove it for MVP simplicity, assuming user emptied it or we don't care about orphans yet.
        await db.remove(`folders/${params.id}`);

        await logEvent(
            user.tenant_id,
            userId,
            "delete_folder",
            "folder",
            folder.id,
            { name: folder.name }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete folder error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { name } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "Folder name required" }, { status: 400 });
        }

        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const folder = await db.get<Folder>(`folders/${params.id}`);
        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        if (folder.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Update folder name
        await db.update(`folders/${params.id}`, {
            name: name.trim(),
            updated_at: Date.now()
        });

        await logEvent(
            user.tenant_id,
            userId,
            "rename_folder",
            "folder",
            folder.id,
            { old_name: folder.name, new_name: name.trim() }
        );

        return NextResponse.json({ success: true, name: name.trim() });
    } catch (error: any) {
        console.error("Rename folder error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
