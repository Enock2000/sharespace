import { NextResponse } from "next/server";
import { createFile } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";

export async function POST(request: Request) {
    try {
        const { name, size, mime_type, folderId, userId, filestackUrl, filestackHandle, provider, fileId, fileName } = await request.json();

        if (!name || !size || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Determine storage key and provider
        let storageKey = filestackUrl;
        let fileProvider = provider || "filestack";

        if (fileProvider === "backblaze") {
            if (!fileId || !fileName) {
                return NextResponse.json({ error: "Missing B2 file details" }, { status: 400 });
            }
            storageKey = fileId; // Store B2 file ID as key
        } else if (!filestackUrl) {
            return NextResponse.json({ error: "Missing Filestack URL" }, { status: 400 });
        }

        // Get user to find tenant
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create DB record
        const file = await createFile(
            user.tenant_id,
            folderId || null, // Use null instead of "root" to match query logic
            userId,
            {
                name,
                size,
                mime_type,
                storage_key: storageKey,
                provider: fileProvider as "filestack" | "backblaze",
            }
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "upload_file",
            "file",
            file.id,
            { name, size, mime_type, provider: fileProvider }
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
