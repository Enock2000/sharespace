import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, Team, TeamMember } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";

// GET - List all teams for tenant
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch all teams and filter by tenant_id
        // This ensures we don't rely on any database indexes
        const teamsMap = await db.get<Record<string, Team>>(`teams`) || {};
        const tenantTeams = Object.values(teamsMap)
            .filter(t => t.tenant_id === user.tenant_id)
            .sort((a, b) => a.name.localeCompare(b.name));

        // Get member counts for each team
        // We fetch all members and count in memory to avoid index reliance
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only admins and owners can create teams
        if (!["owner", "admin", "super_admin", "platform_admin"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

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
            created_by: userId,
            created_at: Date.now(),
            updated_at: Date.now()
        };

        await db.set(`teams/${team.id}`, team);

        // Add creator as team admin
        const membership: TeamMember = {
            team_id: team.id,
            user_id: userId,
            role: "admin",
            added_by: userId,
            added_at: Date.now()
        };

        await db.set(`team_members/tm_${team.id}_${userId}`, membership);

        await logEvent(user.tenant_id, userId, "create_team", "team", team.id, {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const teamId = searchParams.get("teamId");

    if (!userId || !teamId) {
        return NextResponse.json({ error: "User ID and Team ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const team = await db.get<Team>(`teams/${teamId}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Only owners can delete teams
        if (!["owner", "super_admin", "platform_admin"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete team
        await db.remove(`teams/${teamId}`);

        // Delete all memberships
        const membersMap = await db.get<Record<string, TeamMember>>(`team_members`) || {};
        for (const [key, member] of Object.entries(membersMap)) {
            if (member.team_id === teamId) {
                await db.remove(`team_members/${key}`);
            }
        }

        await logEvent(user.tenant_id, userId, "delete_team", "team", teamId, {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const teamId = searchParams.get("teamId");

    if (!userId || !teamId) {
        return NextResponse.json({ error: "User ID and Team ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const team = await db.get<Team>(`teams/${teamId}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Check if user is team admin
        const memberKey = `tm_${teamId}_${userId}`;
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
