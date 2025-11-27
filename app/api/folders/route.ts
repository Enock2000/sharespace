import { NextResponse } from "next/server";
import { createFolder } from "@/lib/storage/file-service";
import { db } from "@/lib/database/schema";
import { logEvent } from "@/lib/utils/audit-logger";
import { User } from "@/types/database";

export async function POST(request: Request) {
    try {
        const { name, parentId, userId } = await request.json();

        if (!name || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const folder = await createFolder(
            user.tenant_id,
            parentId || null,
            userId,
            name
        );

        // Log audit event
        await logEvent(
            user.tenant_id,
            userId,
            "create_folder",
            "folder",
            folder.id,
            { name, parentId }
        );

        return NextResponse.json(folder);
    } catch (error: any) {
        console.error("Create folder error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
