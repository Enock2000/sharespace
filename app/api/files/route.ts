import { NextResponse } from "next/server";
import { getFolderContents } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

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
