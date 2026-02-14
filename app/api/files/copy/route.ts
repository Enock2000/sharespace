import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { copyFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { File } from "@/types/database";

export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { fileId, destinationFolderId } = await request.json();

        if (!fileId) {
            return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
        }

        // Verify ownership/permission
        const file = await db.get<File>(`files/${fileId}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Verify destination folder exists and belongs to tenant (unless root)
        if (destinationFolderId && destinationFolderId !== "root") {
            const folder = await db.get(`folders/${destinationFolderId}`);
            // @ts-ignore
            if (!folder || folder.tenant_id !== user.tenant_id) {
                return NextResponse.json({ error: "Destination folder not found" }, { status: 404 });
            }
        }

        const copiedFile = await copyFile(fileId, destinationFolderId || null, user.id);

        return NextResponse.json({ file: copiedFile });
    } catch (error: any) {
        console.error("Copy file error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
