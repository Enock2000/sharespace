import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { db } from "@/lib/database/schema";
import { Team } from "@/types/database";

export async function GET(req: Request) {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        // Fetch all teams for the tenant
        // Note: In a real large-scale app, we'd filter via index.
        const allTeams = await db.get<Record<string, Team>>("teams");
        const tenantTeams = allTeams
            ? Object.values(allTeams).filter(t => t.tenant_id === user.tenant_id)
            : [];

        return NextResponse.json({ teams: tenantTeams });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
