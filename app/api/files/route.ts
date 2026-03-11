import { NextResponse } from "next/server";
import { getFolderContents } from "@/lib/storage/file-service";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    try {
        const contents = await getFolderContents(folderId, user.tenant_id);
        return NextResponse.json(contents);
    } catch (error: any) {
        console.error("List files error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
