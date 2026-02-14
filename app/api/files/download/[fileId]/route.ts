import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";
import { db } from "@/lib/database/schema";
import { File } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

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

        // 4. Generate Download URL from B2
        const fileName = file.b2_file_name || file.name;
        const url = await backblazeService.getDownloadUrl(fileName);

        // 5. Proxy the file content instead of redirecting
        // This ensures proper Content-Type headers for img/video/audio tags
        const b2Response = await fetch(url);

        if (!b2Response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch file from storage" },
                { status: 502 }
            );
        }

        const contentType = file.mime_type || b2Response.headers.get("content-type") || "application/octet-stream";
        const contentLength = b2Response.headers.get("content-length");

        const headers: Record<string, string> = {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=3600",
            "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        };

        if (contentLength) {
            headers["Content-Length"] = contentLength;
        }

        // Stream the response body
        return new Response(b2Response.body, {
            status: 200,
            headers,
        });

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed: " + error.message }, { status: 500 });
    }
}
