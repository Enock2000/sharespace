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

        // Use b2_file_name if available (the actual filename in B2)
        // Don't encode here - getDownloadUrl will handle encoding
        const fileName = file.b2_file_name || file.name;
        const url = await backblazeService.getDownloadUrl(fileName);

        // Log for debugging
        console.log("Redirecting to B2 URL:", url.substring(0, 100) + "...");

        // Redirect to the Backblaze download URL
        return NextResponse.redirect(url);

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed: " + error.message }, { status: 500 });
    }
}
