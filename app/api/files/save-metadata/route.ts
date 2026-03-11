import { NextResponse } from "next/server";
import { createFile, findFile, addFileVersion, checkStorageQuota } from "@/lib/storage/file-service";
import { logEvent } from "@/lib/utils/audit-logger";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

// This endpoint saves metadata after a direct B2 upload
export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { name, size, mime_type, folderId, fileId, fileName } = await request.json();

        if (!name || !size || !fileId || !fileName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check storage quota
        const hasQuota = await checkStorageQuota(user.tenant_id, size);
        if (!hasQuota) {
            return NextResponse.json({ error: "Storage quota exceeded. Please upgrade your plan." }, { status: 403 });
        }

        // Check if file already exists
        const existingFile = await findFile(
            user.tenant_id,
            folderId === "null" || !folderId ? null : folderId,
            name
        );

        let dbFile;
        if (existingFile) {
            // Add new version
            await addFileVersion(existingFile.id, {
                size,
                storage_key: fileId,
                b2_file_name: fileName,
                userId: user.id
            });
            dbFile = existingFile; // Return existing file ID
        } else {
            // Create new file
            dbFile = await createFile(
                user.tenant_id,
                folderId === "null" || !folderId ? null : folderId,
                user.id,
                {
                    name,
                    size,
                    mime_type: mime_type || "application/octet-stream",
                    storage_key: fileId,
                    b2_file_name: fileName
                }
            );
        }

        // Log audit event
        await logEvent(
            user.tenant_id,
            user.id,
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
