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

        if (file.provider === "backblaze") {
            // For B2, we need to generate a signed URL using the file name
            // Note: We stored the B2 fileId in storage_key, but getDownloadUrl uses fileName
            const url = await backblazeService.getDownloadUrl(file.name);
            return NextResponse.redirect(url);
        } else if (file.storage_key && file.storage_key.startsWith("http")) {
            // Legacy Filestack or other URL-based storage
            return NextResponse.redirect(file.storage_key);
        }

        return NextResponse.json({ error: "Invalid file provider or storage key" }, { status: 400 });

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }
}
