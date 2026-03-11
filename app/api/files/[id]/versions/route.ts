import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { getFileVersions } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { File } from "@/types/database";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const fileId = params.id;

        // internal check: file exists and tenant matches
        const file = await db.get<File>(`files/${fileId}`);
        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        if (file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const versions = await getFileVersions(fileId);

        return NextResponse.json({ versions });
    } catch (error: any) {
        console.error("Get versions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
