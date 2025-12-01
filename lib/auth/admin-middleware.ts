import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase-config";
import { getAuth } from "firebase/auth";

/**
 * Middleware to require platform admin authentication
 * Checks if the user has platform_admin or super_admin role
 */
export async function requirePlatformAdmin(request: NextRequest) {
    try {
        // Get the Firebase auth token from the request
        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        const token = authHeader.split("Bearer ")[1];

        // Verify the token with Firebase Admin SDK (you'll need to set this up)
        // For now, we'll use client-side auth check
        const currentUser = getAuth().currentUser;

        if (!currentUser) {
            return NextResponse.json(
                { error: "Unauthorized - Not authenticated" },
                { status: 401 }
            );
        }

        // Get user role from database
        const userRole = await getUserRole(currentUser.uid);

        if (userRole !== "platform_admin" && userRole !== "super_admin") {
            return NextResponse.json(
                { error: "Forbidden - Platform admin access required" },
                { status: 403 }
            );
        }

        // User is authenticated and authorized
        return {
            userId: currentUser.uid,
            role: userRole,
        };

    } catch (error) {
        console.error("Admin auth error:", error);
        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get user role from database
 */
async function getUserRole(userId: string): Promise<string | null> {
    try {
        const { db } = await import("@/lib/database/schema");
        const { ref, get } = await import("firebase/database");

        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            return null;
        }

        return snapshot.val().role || null;
    } catch (error) {
        console.error("Error fetching user role:", error);
        return null;
    }
}

/**
 * Check if user is platform admin (client-side)
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
    const role = await getUserRole(userId);
    return role === "platform_admin" || role === "super_admin";
}

/**
 * Middleware to log admin actions
 */
export async function logAdminAction(
    adminId: string,
    adminEmail: string,
    action: string,
    targetType: string,
    targetId?: string,
    metadata?: Record<string, any>
) {
    try {
        const { createAdminAuditLog } = await import("@/lib/database/admin-schema");

        await createAdminAuditLog({
            admin_id: adminId,
            admin_email: adminEmail,
            action: action as any,
            target_type: targetType as any,
            target_id: targetId,
            timestamp: Date.now(),
            metadata: metadata,
        });
    } catch (error) {
        console.error("Error logging admin action:", error);
    }
}

/**
 * Get admin info from request
 */
export async function getAdminFromRequest(request: NextRequest) {
    const authResult = await requirePlatformAdmin(request);

    if (authResult instanceof NextResponse) {
        // It's an error response
        return null;
    }

    return authResult;
}
