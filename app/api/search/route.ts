import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, Folder } from "@/types/database";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const query = searchParams.get("q")?.toLowerCase() || "";
    const type = searchParams.get("type"); // "file" | "folder" | "all"
    const folderId = searchParams.get("folderId"); // Search within specific folder
    const mimeType = searchParams.get("mimeType"); // Filter by mime type (e.g., "image/", "video/")
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    if (!query || query.length < 2) {
        return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const results: { files: File[]; folders: Folder[] } = { files: [], folders: [] };

        // Search files
        if (!type || type === "file" || type === "all") {
            const filesMap = await db.get<Record<string, File>>(`files`) || {};
            let matchingFiles = Object.values(filesMap)
                .filter(f =>
                    f.tenant_id === user.tenant_id &&
                    !f.is_deleted &&
                    f.name.toLowerCase().includes(query)
                );

            // Apply folder filter
            if (folderId) {
                matchingFiles = matchingFiles.filter(f => f.folder_id === folderId);
            }

            // Apply mime type filter
            if (mimeType) {
                matchingFiles = matchingFiles.filter(f => f.mime_type?.startsWith(mimeType));
            }

            // Sort by relevance (exact match first, then by date)
            matchingFiles.sort((a, b) => {
                const aExact = a.name.toLowerCase() === query;
                const bExact = b.name.toLowerCase() === query;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return b.created_at - a.created_at;
            });

            results.files = matchingFiles.slice(0, limit);
        }

        // Search folders
        if (!type || type === "folder" || type === "all") {
            const foldersMap = await db.get<Record<string, Folder>>(`folders`) || {};
            let matchingFolders = Object.values(foldersMap)
                .filter(f =>
                    f.tenant_id === user.tenant_id &&
                    f.name.toLowerCase().includes(query)
                );

            // Apply parent folder filter
            if (folderId) {
                matchingFolders = matchingFolders.filter(f => f.parent_id === folderId);
            }

            // Sort by relevance
            matchingFolders.sort((a, b) => {
                const aExact = a.name.toLowerCase() === query;
                const bExact = b.name.toLowerCase() === query;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                return b.created_at - a.created_at;
            });

            results.folders = matchingFolders.slice(0, limit);
        }

        return NextResponse.json({
            query,
            results,
            total: results.files.length + results.folders.length
        });
    } catch (error: any) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
