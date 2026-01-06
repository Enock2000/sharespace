import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";

export async function POST(request: Request) {
    try {
        const { fileName, contentType } = await request.json();

        if (!fileName) {
            return NextResponse.json({ error: "fileName is required" }, { status: 400 });
        }

        const result = await backblazeService.startLargeFile(fileName, contentType);

        return NextResponse.json({
            fileId: result.fileId,
            fileName: result.fileName,
        });
    } catch (error: any) {
        console.error("Start large file error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
