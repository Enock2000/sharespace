import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";
import { createFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;
        const folderId = formData.get("folderId") as string | null;

        if (!file || !userId) {
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

        // Get upload URL from Backblaze
        const uploadData = await backblazeService.getUploadUrl();

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Backblaze B2
        const uploadResponse = await fetch(uploadData.uploadUrl, {
            method: "POST",
            headers: {
                "Authorization": uploadData.authorizationToken,
                "X-Bz-File-Name": encodeURIComponent(file.name),
                "Content-Type": file.type || "application/octet-stream",
                "Content-Length": buffer.length.toString(),
                "X-Bz-Content-Sha1": "do_not_verify"
            },
            body: buffer
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("B2 Upload Error:", errorText);
            return NextResponse.json(
                { error: "Failed to upload to storage" },
                { status: 500 }
            );
        }

        const uploadResult = await uploadResponse.json();

        // Create DB record
        const dbFile = await createFile(
            user.tenant_id,
            folderId === "null" ? null : folderId,
            userId,
            {
                name: file.name,
                size: file.size,
                mime_type: file.type || "application/octet-stream",
                storage_key: uploadResult.fileId,
                b2_file_name: uploadResult.fileName
            }
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "upload_file",
            "file",
            dbFile.id,
            { name: file.name, size: file.size, mime_type: file.type }
        );

        return NextResponse.json({
            success: true,
            fileId: dbFile.id,
            b2FileId: uploadResult.fileId,
            fileName: uploadResult.fileName
        });
    } catch (error: any) {
        console.error("=============== UPLOAD ERROR ===============");
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("===========================================");
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
