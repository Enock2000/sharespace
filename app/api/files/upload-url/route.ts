import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";

export async function GET() {
    try {
        const uploadData = await backblazeService.getUploadUrl();

        return NextResponse.json({
            uploadUrl: uploadData.uploadUrl,
            authorizationToken: uploadData.authorizationToken
        });
    } catch (error: any) {
        console.error("Failed to get upload URL:", error);
        return NextResponse.json(
            { error: "Failed to get upload URL" },
            { status: 500 }
        );
    }
}
