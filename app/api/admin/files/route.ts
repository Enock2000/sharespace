import { NextRequest, NextResponse } from "next/server";
import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, get } from "firebase/database";
import { File } from "@/types/database";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get("tenant");
        const search = searchParams.get("search")?.toLowerCase();

        const db = getFirebaseDatabase();
        const filesQuery = ref(db, "files");
        const filesSnapshot = await get(filesQuery);

        if (!filesSnapshot.exists()) {
            return NextResponse.json({ files: [] });
        }

        let files: File[] = [];
        filesSnapshot.forEach((child) => {
            files.push(child.val());
        });

        // Apply filters
        if (tenantId) {
            files = files.filter((f) => f.tenant_id === tenantId);
        }

        if (search) {
            files = files.filter((f) =>
                f.name.toLowerCase().includes(search) ||
                f.uploaded_by.toLowerCase().includes(search)
            );
        }

        // Sort by date desc
        files.sort((a, b) => b.created_at - a.created_at);

        // Limit results for performance (e.g., 100 most recent)
        // In a real app, implement cursor-based pagination
        const limitedFiles = files.slice(0, 100);

        return NextResponse.json({ files: limitedFiles });
    } catch (error) {
        console.error("Error fetching files:", error);
        return NextResponse.json(
            { error: "Failed to fetch files" },
            { status: 500 }
        );
    }
}
