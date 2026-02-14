import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { Team, TeamMember } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";
import { authenticateRequest, requireRole } from "@/lib/auth/auth-api";

// GET - List all teams for tenant
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const teamsMap = await db.get<Record<string, Team>>(`teams`) || {};
        const tenantTeams = Object.values(teamsMap)
            .filter(t => t.tenant_id === user.tenant_id)
            .sort((a, b) => a.name.localeCompare(b.name));

        const membersMap = await db.get<Record<string, TeamMember>>(`team_members`) || {};
        const allMembers = Object.values(membersMap);

        const teamsWithCounts = tenantTeams.map(team => ({
            ...team,
            member_count: allMembers.filter(m => m.team_id === team.id).length
        }));

        return NextResponse.json({ teams: teamsWithCounts });
    } catch (error: any) {
        console.error("Get teams error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new team
export async function POST(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only admins and owners can create teams
    const roleCheck = requireRole(user, "admin");
    if (roleCheck) return roleCheck;

    try {
        const body = await request.json();
        const { name, description, color } = body;

        if (!name) {
            return NextResponse.json({ error: "Team name required" }, { status: 400 });
        }

        const team: Team = {
            id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tenant_id: user.tenant_id,
            name: name.trim(),
            description: description || "",
            color: color || "#3b82f6",
            created_by: user.id,
            created_at: Date.now(),
            updated_at: Date.now()
        };

        await db.set(`teams/${team.id}`, team);

        // Add creator as team admin
        const membership: TeamMember = {
            team_id: team.id,
            user_id: user.id,
            role: "admin",
            added_by: user.id,
            added_at: Date.now()
        };

        await db.set(`team_members/tm_${team.id}_${user.id}`, membership);

        await logEvent(user.tenant_id, user.id, "create_team", "team", team.id, {
            name: team.name
        });

        return NextResponse.json({ team: { ...team, member_count: 1 } });
    } catch (error: any) {
        console.error("Create team error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete team
export async function DELETE(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only owners can delete teams
    const roleCheck = requireRole(user, "owner");
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
        return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    try {
        const team = await db.get<Team>(`teams/${teamId}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        await db.remove(`teams/${teamId}`);

        // Delete all memberships
        const membersMap = await db.get<Record<string, TeamMember>>(`team_members`) || {};
        for (const [key, member] of Object.entries(membersMap)) {
            if (member.team_id === teamId) {
                await db.remove(`team_members/${key}`);
            }
        }

        await logEvent(user.tenant_id, user.id, "delete_team", "team", teamId, {
            name: team.name
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete team error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update team
export async function PATCH(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
        return NextResponse.json({ error: "Team ID required" }, { status: 400 });
    }

    try {
        const team = await db.get<Team>(`teams/${teamId}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Check if user is team admin or org admin
        const memberKey = `tm_${teamId}_${user.id}`;
        const membership = await db.get<TeamMember>(`team_members/${memberKey}`);
        const isTeamAdmin = membership?.role === "admin";
        const isOrgAdmin = ["owner", "admin", "super_admin", "platform_admin"].includes(user.role);

        if (!isTeamAdmin && !isOrgAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const updates: Partial<Team> = { updated_at: Date.now() };

        if (body.name) updates.name = body.name.trim();
        if (body.description !== undefined) updates.description = body.description;
        if (body.color) updates.color = body.color;

        await db.update(`teams/${teamId}`, updates);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update team error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
