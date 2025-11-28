import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File } from "@/types/database";
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

        const file = await db.get<File>(`files/${params.id}`);
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        if (file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Soft delete
        await db.update(`files/${params.id}`, { is_deleted: true });

        await logEvent(
            user.tenant_id,
            userId,
            "delete_file",
            "file",
            file.id,
            { name: file.name }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete file error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
