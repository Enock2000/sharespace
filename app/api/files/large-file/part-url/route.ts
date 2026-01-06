import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";

export async function POST(request: Request) {
    try {
        const { fileId } = await request.json();

        if (!fileId) {
            return NextResponse.json({ error: "fileId is required" }, { status: 400 });
        }

        const result = await backblazeService.getUploadPartUrl(fileId);

        return NextResponse.json({
            uploadUrl: result.uploadUrl,
            authorizationToken: result.authorizationToken,
        });
    } catch (error: any) {
        console.error("Get upload part URL error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
