import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, UploadRecord } from "@/types/database";

// PATCH - Update upload status/progress
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { userId, status, progress, errorMessage, b2FileId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const upload = await db.get<UploadRecord>(`uploads/${user.tenant_id}/${params.id}`);
        if (!upload) {
            return NextResponse.json({ error: "Upload not found" }, { status: 404 });
        }

        if (upload.user_id !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updates: Partial<UploadRecord> = {
            updated_at: Date.now()
        };

        if (status) updates.status = status;
        if (typeof progress === "number") updates.progress = progress;
        if (errorMessage !== undefined) updates.error_message = errorMessage;
        if (b2FileId) updates.b2_file_id = b2FileId;

        // Increment retry count if retrying
        if (status === "uploading" && upload.status === "failed") {
            updates.retry_count = (upload.retry_count || 0) + 1;
        }

        await db.update(`uploads/${user.tenant_id}/${params.id}`, updates);

        return NextResponse.json({ success: true, upload: { ...upload, ...updates } });
    } catch (error: any) {
        console.error("Update upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove specific upload record
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

        const upload = await db.get<UploadRecord>(`uploads/${user.tenant_id}/${params.id}`);
        if (!upload) {
            return NextResponse.json({ error: "Upload not found" }, { status: 404 });
        }

        if (upload.user_id !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.remove(`uploads/${user.tenant_id}/${params.id}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
