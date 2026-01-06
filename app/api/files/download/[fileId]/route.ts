import { NextResponse } from "next/server";
import { backblazeService } from "@/lib/storage/backblaze";
import { db } from "@/lib/database/schema";
import { File } from "@/types/database";

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
    try {
        const fileId = params.fileId;
        const file = await db.get<File>(`files/${fileId}`);

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Use b2_file_name if available, otherwise fall back to the display name
        const fileName = file.b2_file_name || file.name;
        const url = await backblazeService.getDownloadUrl(fileName);
        return NextResponse.redirect(url);

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }
}
