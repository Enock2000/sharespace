import { NextResponse } from "next/server";
import { createFolder } from "@/lib/storage/file-service";
import { logEvent } from "@/lib/utils/audit-logger";
import { authenticateRequest } from "@/lib/auth/auth-api";

export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { name, parentId } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Folder name is required" },
                { status: 400 }
            );
        }

        const folder = await createFolder(
            user.tenant_id,
            parentId || null,
            user.id,
            name
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            user.id,
            "create_folder",
            "folder",
            folder.id,
            { name, parentId }
        );

        return NextResponse.json(folder);
    } catch (error: any) {
        console.error("Create folder error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
