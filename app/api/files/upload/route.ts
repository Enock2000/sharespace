import { NextResponse } from "next/server";
import { createFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";

export async function POST(request: Request) {
    try {
        const { name, size, mime_type, folderId, userId, fileId, fileName } = await request.json();

        if (!name || !size || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!fileId || !fileName) {
            return NextResponse.json({ error: "Missing Backblaze file details" }, { status: 400 });
        }

        // Get user to find tenant
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create DB record with Backblaze as the only provider
        const file = await createFile(
            user.tenant_id,
            folderId || null,
            userId,
            {
                name,
                size,
                mime_type,
                storage_key: fileId, // Store B2 file ID as key
                b2_file_name: fileName
            }
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "upload_file",
            "file",
            file.id,
            { name, size, mime_type, provider: "backblaze" }
        );

        return NextResponse.json({
            success: true,
            fileId: file.id,
        });
    } catch (error: any) {
        console.error("=============== UPLOAD ERROR ===============");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Error details:", error);
        console.error("===========================================");
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
