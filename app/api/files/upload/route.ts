import { NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/storage/backblaze";
import { createFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const { name, size, mime_type, folderId, userId, filestackUrl, filestackHandle } = await request.json();

        if (!name || !size || !userId || !filestackUrl) {
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
        // We store the Filestack URL as the storage_key or add a new field
        // For backward compatibility, we'll use storage_key for the URL if it's a string
        const file = await createFile(
            user.tenant_id,
            folderId || "root",
            userId,
            {
                name,
                size,
                mime_type,
                storage_key: filestackUrl, // Using URL as storage key for now
            }
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "upload_file",
            "file",
            file.id,
            { name, size, mime_type, provider: "filestack" }
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
