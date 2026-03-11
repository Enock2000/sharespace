import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { UploadRecord } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

// GET - List uploads for user
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // Optional filter

    try {
        const uploadsMap = await db.get<Record<string, UploadRecord>>(`uploads/${user.tenant_id}`) || {};
        let uploads = Object.values(uploadsMap)
            .filter(u => u.user_id === user.id)
            .sort((a, b) => b.updated_at - a.updated_at);

        if (status) {
            uploads = uploads.filter(u => u.status === status);
        }

        return NextResponse.json({ uploads });
    } catch (error: any) {
        console.error("Get uploads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new upload record
export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const body = await request.json();
        const { fileName, fileSize, mimeType, folderId } = body;

        if (!fileName || !fileSize) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const record: UploadRecord = {
            id: uploadId,
            user_id: user.id,
            tenant_id: user.tenant_id,
            file_name: fileName,
            file_size: fileSize,
            mime_type: mimeType || "application/octet-stream",
            folder_id: folderId || null,
            status: "pending",
            progress: 0,
            created_at: Date.now(),
            updated_at: Date.now(),
            retry_count: 0
        };

        await db.set(`uploads/${user.tenant_id}/${uploadId}`, record);

        return NextResponse.json({ upload: record });
    } catch (error: any) {
        console.error("Create upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove all completed/failed uploads for user (cleanup)
export async function DELETE(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const uploadsMap = await db.get<Record<string, UploadRecord>>(`uploads/${user.tenant_id}`) || {};
        const toDelete = Object.values(uploadsMap)
            .filter(u => u.user_id === user.id && (u.status === "complete" || u.status === "failed"));

        for (const upload of toDelete) {
            await db.remove(`uploads/${user.tenant_id}/${upload.id}`);
        }

        return NextResponse.json({ deleted: toDelete.length });
    } catch (error: any) {
        console.error("Delete uploads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
