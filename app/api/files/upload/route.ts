import { NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/storage/backblaze";
import { createFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const { name, size, mime_type, folderId, userId } = await request.json();

        if (!name || !size || !userId) {
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

        // Generate storage key (unique filename for B2)
        const storageKey = `${user.tenant_id}/${uuidv4()}`;

        // Get B2 upload URL
        const b2Upload = await getUploadUrl();

        // Create DB record
        const file = await createFile(
            user.tenant_id,
            folderId || "root", // Handle root folder
            userId,
            {
                name,
                size,
                mime_type,
                storage_key: storageKey,
            }
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "upload_file",
            "file",
            file.id,
            { name, size, mime_type }
        );

        return NextResponse.json({
            uploadUrl: b2Upload.uploadUrl,
            authorizationToken: b2Upload.authorizationToken,
            fileId: file.id,
            storageKey,
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
