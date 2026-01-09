import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, UploadRecord } from "@/types/database";

// GET - List uploads for user
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status"); // Optional filter

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all uploads for this tenant
        const uploadsMap = await db.get<Record<string, UploadRecord>>(`uploads/${user.tenant_id}`) || {};
        let uploads = Object.values(uploadsMap)
            .filter(u => u.user_id === userId)
            .sort((a, b) => b.updated_at - a.updated_at);

        // Filter by status if provided
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
    try {
        const body = await request.json();
        const { userId, fileName, fileSize, mimeType, folderId } = body;

        if (!userId || !fileName || !fileSize) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const record: UploadRecord = {
            id: uploadId,
            user_id: userId,
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

        const uploadsMap = await db.get<Record<string, UploadRecord>>(`uploads/${user.tenant_id}`) || {};
        const toDelete = Object.values(uploadsMap)
            .filter(u => u.user_id === userId && (u.status === "complete" || u.status === "failed"));

        for (const upload of toDelete) {
            await db.remove(`uploads/${user.tenant_id}/${upload.id}`);
        }

        return NextResponse.json({ deleted: toDelete.length });
    } catch (error: any) {
        console.error("Delete uploads error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
