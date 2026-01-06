import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";

export async function POST(request: Request) {
    try {
        const { fileId } = await request.json();

        if (!fileId) {
            return NextResponse.json({ error: "fileId is required" }, { status: 400 });
        }

        const result = await backblazeService.cancelLargeFile(fileId);

        return NextResponse.json({
            success: true,
            cancelled: result,
        });
    } catch (error: any) {
        console.error("Cancel large file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
