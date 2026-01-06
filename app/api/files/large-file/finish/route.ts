import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";
import { db } from "@/lib/database/schema";

export async function POST(request: Request) {
    try {
        const { fileId, partSha1Array, fileName, fileSize, contentType, folderId, userId } = await request.json();

        if (!fileId || !partSha1Array || !fileName) {
            return NextResponse.json({ error: "fileId, partSha1Array, and fileName are required" }, { status: 400 });
        }

        // Finish the large file upload in B2
        const result = await backblazeService.finishLargeFile(fileId, partSha1Array);

        // Save file metadata to database
        const newFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileRecord = {
            id: newFileId,
            name: fileName.split('/').pop() || fileName, // Get just the filename
            size: fileSize || 0,
            mime_type: contentType || "application/octet-stream",
            storage_key: result.fileId,
            b2_file_name: result.fileName,
            provider: "backblaze",
            folder_id: folderId || null,
            user_id: userId,
            created_at: Date.now(),
            updated_at: Date.now(),
        };

        await db.set(`files/${newFileId}`, fileRecord);

        return NextResponse.json({
            success: true,
            file: fileRecord,
            b2FileId: result.fileId,
        });
    } catch (error: any) {
        console.error("Finish large file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
