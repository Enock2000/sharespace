import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";
import { db } from "@/lib/database/schema";
import { File } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
    // 1. Authenticate Request (supports header or ?token=...)
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const fileId = params.fileId;
        const file = await db.get<File>(`files/${fileId}`);

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // 2. Security Check: Ensure user belongs to the same tenant
        if (file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // 3. Log "Recent File" Access
        try {
            await db.set(`users/${user.id}/recent/${fileId}`, {
                user_id: user.id,
                file_id: fileId,
                accessed_at: Date.now()
            });
        } catch (logError) {
            console.warn("Failed to log recent file access:", logError);
        }

        // 4. Generate Download URL from B2 using file ID
        const b2FileId = file.storage_key;
        
        // This gets the signed URL using download-by-file-ID
        let url = await backblazeService.getDownloadUrl(b2FileId);

        // Append B2 query parameters to force inline display and correct filename
        const inlineDisposition = `inline; filename="${encodeURIComponent(file.name)}"`;
        url += `&b2ContentDisposition=${encodeURIComponent(inlineDisposition)}`;

        // If mimeType exists, tell B2 to serve it with that type
        if (file.mime_type) {
            url += `&b2ContentType=${encodeURIComponent(file.mime_type)}`;
        }

        // 5. Redirect the client directly to Backblaze.
        // Proxying large files via Vercel Serverless Functions causes 502 Bad Gateway
        // due to payload size (4.5MB), memory, and execution timeout limits.
        return NextResponse.redirect(url);

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed: " + error.message }, { status: 500 });
    }
}
