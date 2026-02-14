import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";
import { authenticateRequest, requireRole } from "@/lib/auth/auth-api";
import { logEvent } from "@/lib/utils/audit-logger";
import { getAdminAuth } from "@/lib/firebase-admin";

// GET - Get user details
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user: requester } = authResult;

    try {
        const targetUser = await db.get<User>(`users/${params.id}`);

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify tenant
        if (targetUser.tenant_id !== requester.tenant_id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user: targetUser });
    } catch (error: any) {
        console.error("Get user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update user profile
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user: requester } = authResult;

    // Only allow updating self or if admin updates others in same tenant
    if (requester.id !== params.id) {
        const roleCheck = requireRole(requester, "admin");
        if (roleCheck) return roleCheck;
    }

    try {
        const targetUser = await db.get<User>(`users/${params.id}`);
        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (targetUser.tenant_id !== requester.tenant_id) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { first_name, last_name, role } = body;

        const updates: Partial<User> = { updated_at: Date.now() };

        if (first_name) updates.first_name = first_name;
        if (last_name) updates.last_name = last_name;

        // Only admins can update roles, and not for themselves (to prevent accidental lockout or escalation)
        if (role && requester.role === "owner" && requester.id !== params.id) {
            updates.role = role;
        } else if (role && requester.role === "admin" && requester.id !== params.id && role !== "owner") {
            // Admins can verify roles but can't ascend to owner or demote other admins/owners? 
            // Simplified: Admins can update roles of non-admins/owners.
            if (targetUser.role !== "owner" && targetUser.role !== "admin") {
                updates.role = role;
            }
        }

        await db.update(`users/${params.id}`, updates);

        // Also update Firebase auth profile if name changed
        if (first_name || last_name) {
            const displayName = `${first_name || targetUser.first_name} ${last_name || targetUser.last_name}`;
            try {
                await getAdminAuth().updateUser(params.id, {
                    displayName
                });
            } catch (fbError) {
                console.warn("Failed to update Firebase profile:", fbError);
            }
        }

        await logEvent(
            requester.tenant_id,
            requester.id,
            "update_user",
            "user",
            params.id,
            { updates }
        );

        return NextResponse.json({ success: true, user: { ...targetUser, ...updates } });
    } catch (error: any) {
        console.error("Update user error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
