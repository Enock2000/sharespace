import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { File, RecentFile } from "@/types/database";

export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        // Fetch recent file records for the user
        const recentFilesMap = await db.get<Record<string, RecentFile>>(`users/${user.id}/recent`);

        if (!recentFilesMap) {
            return NextResponse.json({ files: [] });
        }

        const recentFilesList = Object.values(recentFilesMap);

        // Sort by accessed_at descending
        recentFilesList.sort((a, b) => b.accessed_at - a.accessed_at);

        // Fetch actual file details
        // Limit to last 50 recent files
        const recentFilesLimit = recentFilesList.slice(0, 50);

        const files: File[] = [];

        for (const recent of recentFilesLimit) {
            try {
                const file = await db.get<File>(`files/${recent.file_id}`);
                // Check if file exists and belongs to tenant (in case it was deleted or moved)
                if (file && !file.is_deleted && file.tenant_id === user.tenant_id) {
                    files.push(file);
                }
            } catch (e) {
                // Ignore missing files
            }
        }

        return NextResponse.json({ files });
    } catch (error: any) {
        console.error("Recent files error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
