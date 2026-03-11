import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        // Fetch all users and filter by tenant_id
        const usersMap = await db.get<Record<string, User>>(`users`) || {};
        const tenantUsers = Object.values(usersMap)
            .filter(u => u.tenant_id === user.tenant_id)
            .sort((a, b) => {
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
