import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { File, Folder } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase();
    const type = searchParams.get("type"); // "file", "folder", or null for both
    const folderId = searchParams.get("folderId");
    const mimeType = searchParams.get("mimeType");
    const category = searchParams.get("category"); // "image", "video", "audio", "document"

    if (!query || query.length < 2) {
        return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    try {
        const results: any[] = [];

        // Search files
        if (!type || type === "file") {
            const filesMap = await db.get<Record<string, File>>("files") || {};
            const matchingFiles = Object.values(filesMap).filter(f => {
                if (f.tenant_id !== user.tenant_id) return false;
                if (f.is_deleted) return false;
                if (folderId && f.folder_id !== folderId) return false;
                if (mimeType && f.mime_type !== mimeType) return false;

                // Category filtering
                if (category) {
                    if (category === "image" && !f.mime_type?.startsWith("image/")) return false;
                    if (category === "video" && !f.mime_type?.startsWith("video/")) return false;
                    if (category === "audio" && !f.mime_type?.startsWith("audio/")) return false;
                    if (category === "document") {
                        const isDoc = f.mime_type?.includes("pdf") ||
                            f.mime_type?.includes("word") ||
                            f.mime_type?.includes("text") ||
                            f.mime_type?.includes("document") ||
                            f.mime_type?.includes("sheet") ||
                            f.mime_type?.includes("presentation");
                        if (!isDoc) return false;
                    }
                }

                const nameMatch = f.name.toLowerCase().includes(query);
                return nameMatch;
            });

            results.push(...matchingFiles.map(f => ({
                ...f,
                result_type: "file",
                relevance: f.name.toLowerCase().startsWith(query) ? 2 : 1
            })));
        }

        // Search folders
        if (!type || type === "folder") {
            const foldersMap = await db.get<Record<string, Folder>>("folders") || {};
            const matchingFolders = Object.values(foldersMap).filter(f => {
                if (f.tenant_id !== user.tenant_id) return false;
                const nameMatch = f.name.toLowerCase().includes(query);
                return nameMatch;
            });

            results.push(...matchingFolders.map(f => ({
                ...f,
                result_type: "folder",
                relevance: f.name.toLowerCase().startsWith(query) ? 2 : 1
            })));
        }

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        return NextResponse.json({ results: results.slice(0, 50) });
    } catch (error: any) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
