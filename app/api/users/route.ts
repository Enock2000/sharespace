import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const requester = await db.get<User>(`users/${userId}`);
        if (!requester) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // In a real DB we'd query by tenant_id
        // For MVP/Realtime DB without index, we might need to fetch all users and filter
        // Or maintain a list of user IDs in the tenant object

        // Efficient way for Realtime DB:
        const users = await db.query<User>("users", "tenant_id", requester.tenant_id);

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error("List users error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
