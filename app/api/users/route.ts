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

        // Fetch all users and filter by tenant_id
        // This is more reliable than db.query which requires Firebase indexes
        const usersMap = await db.get<Record<string, User>>(`users`) || {};
        const tenantUsers = Object.values(usersMap)
            .filter(u => u.tenant_id === requester.tenant_id)
            .sort((a, b) => {
                // Sort by name
                const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            });

        return NextResponse.json({ users: tenantUsers });
    } catch (error: any) {
        console.error("List users error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

