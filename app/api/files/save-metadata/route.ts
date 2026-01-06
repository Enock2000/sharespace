import { NextResponse } from "next/server";
import { createFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";

// This endpoint saves metadata after a direct B2 upload
export async function POST(request: Request) {
    try {
        const { name, size, mime_type, folderId, userId, fileId, fileName } = await request.json();

        if (!name || !size || !userId || !fileId || !fileName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Get user to find tenant
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create DB record
        const dbFile = await createFile(
            user.tenant_id,
            folderId === "null" || !folderId ? null : folderId,
            userId,
            {
                name,
                size,
                mime_type: mime_type || "application/octet-stream",
                storage_key: fileId,
                b2_file_name: fileName
            }
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "upload_file",
            "file",
            dbFile.id,
            { name, size, mime_type }
        );

        return NextResponse.json({
            success: true,
            fileId: dbFile.id,
            b2FileId: fileId,
            fileName: fileName
        });
    } catch (error: any) {
        console.error("Save metadata error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
