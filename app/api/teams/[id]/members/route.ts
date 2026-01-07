import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, Team, TeamMember } from "@/types/database";
import { notifySystem } from "@/lib/utils/notifications";

// GET - Get team members
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const team = await db.get<Team>(`teams/${params.id}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Get all members
        const membersMap = await db.get<Record<string, TeamMember>>(`team_members`) || {};
        const teamMembers = Object.values(membersMap)
            .filter(m => m.team_id === params.id);

        // Get user details for each member
        const usersMap = await db.get<Record<string, User>>(`users`) || {};
        const membersWithDetails = teamMembers.map(member => ({
            ...member,
            user: usersMap[member.user_id] ? {
                id: usersMap[member.user_id].id,
                first_name: usersMap[member.user_id].first_name,
                last_name: usersMap[member.user_id].last_name,
                email: usersMap[member.user_id].email
            } : null
        }));

        return NextResponse.json({ team, members: membersWithDetails });
    } catch (error: any) {
        console.error("Get team members error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Add member to team
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const team = await db.get<Team>(`teams/${params.id}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Check if requester is team admin or org admin
        const requesterMemberKey = `tm_${params.id}_${userId}`;
        const requesterMembership = await db.get<TeamMember>(`team_members/${requesterMemberKey}`);
        const isTeamAdmin = requesterMembership?.role === "admin";
        const isOrgAdmin = ["owner", "admin", "super_admin", "platform_admin"].includes(user.role);

        if (!isTeamAdmin && !isOrgAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { memberId, role = "member" } = body;

        if (!memberId) {
            return NextResponse.json({ error: "Member ID required" }, { status: 400 });
        }

        // Verify user exists and is in same tenant
        const memberUser = await db.get<User>(`users/${memberId}`);
        if (!memberUser || memberUser.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already a member
        const memberKey = `tm_${params.id}_${memberId}`;
        const existing = await db.get<TeamMember>(`team_members/${memberKey}`);
        if (existing) {
            return NextResponse.json({ error: "User is already a member" }, { status: 409 });
        }

        // Add member
        const membership: TeamMember = {
            team_id: params.id,
            user_id: memberId,
            role: role === "admin" ? "admin" : "member",
            added_by: userId,
            added_at: Date.now()
        };

        await db.set(`team_members/${memberKey}`, membership);

        // Notify the added user
        await notifySystem(
            memberId,
            user.tenant_id,
            "Added to team",
            `You've been added to the ${team.name} team`,
            "/dashboard/users"
        );

        return NextResponse.json({
            success: true,
            member: {
                ...membership,
                user: {
                    id: memberUser.id,
                    first_name: memberUser.first_name,
                    last_name: memberUser.last_name,
                    email: memberUser.email
                }
            }
        });
    } catch (error: any) {
        console.error("Add team member error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Remove member from team
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const memberId = searchParams.get("memberId");

    if (!userId || !memberId) {
        return NextResponse.json({ error: "User ID and Member ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const team = await db.get<Team>(`teams/${params.id}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Check if requester has permission
        const requesterMemberKey = `tm_${params.id}_${userId}`;
        const requesterMembership = await db.get<TeamMember>(`team_members/${requesterMemberKey}`);
        const isTeamAdmin = requesterMembership?.role === "admin";
        const isOrgAdmin = ["owner", "admin", "super_admin", "platform_admin"].includes(user.role);
        const isSelfRemoval = userId === memberId;

        if (!isTeamAdmin && !isOrgAdmin && !isSelfRemoval) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Remove member
        const memberKey = `tm_${params.id}_${memberId}`;
        await db.remove(`team_members/${memberKey}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Remove team member error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update member role
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
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

        const team = await db.get<Team>(`teams/${params.id}`);
        if (!team || team.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        // Check if requester is team admin or org admin
        const requesterMemberKey = `tm_${params.id}_${userId}`;
        const requesterMembership = await db.get<TeamMember>(`team_members/${requesterMemberKey}`);
        const isTeamAdmin = requesterMembership?.role === "admin";
        const isOrgAdmin = ["owner", "admin", "super_admin", "platform_admin"].includes(user.role);

        if (!isTeamAdmin && !isOrgAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { memberId, role } = body;

        if (!memberId || !role) {
            return NextResponse.json({ error: "Member ID and role required" }, { status: 400 });
        }

        const memberKey = `tm_${params.id}_${memberId}`;
        const membership = await db.get<TeamMember>(`team_members/${memberKey}`);
        if (!membership) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        await db.update(`team_members/${memberKey}`, {
            role: role === "admin" ? "admin" : "member"
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update team member error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
