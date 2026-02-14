import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/database/schema";
import { User } from "@/types/database";
import * as admin from "firebase-admin";

export interface AuthenticatedUser {
    user: User;
    firebaseToken: admin.auth.DecodedIdToken;
}

/**
 * Authenticate an API request by verifying the Firebase ID token from the
 * Authorization header. Returns the authenticated user or a 401 response.
 *
 * Usage in API routes:
 * ```
 * const authResult = await authenticateRequest(request);
 * if (authResult instanceof NextResponse) return authResult;
 * const { user, firebaseToken } = authResult;
 * ```
 */
export async function authenticateRequest(
    request: Request
): Promise<AuthenticatedUser | NextResponse> {
    try {
        let idToken = "";
        const authHeader = request.headers.get("authorization");

        if (authHeader && authHeader.startsWith("Bearer ")) {
            idToken = authHeader.split("Bearer ")[1];
        } else {
            // Check for query param 'token' (useful for downloads/images)
            try {
                const { searchParams } = new URL(request.url);
                const tokenParam = searchParams.get("token");
                if (tokenParam) {
                    idToken = tokenParam;
                }
            } catch (e) {
                // Ignore URL parsing errors
            }
        }

        if (!idToken) {
            return NextResponse.json(
                { error: "Unauthorized — no token provided" },
                { status: 401 }
            );
        }

        // Verify the token server-side with Firebase Admin
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);

        // Fetch the user record from the database
        const user = await db.get<User>(`users/${decodedToken.uid}`);

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized — user not found in database" },
                { status: 401 }
            );
        }

        return { user, firebaseToken: decodedToken };
    } catch (error: any) {
        console.error("[authenticateRequest] Error:", error.message);

        if (error.code === "auth/id-token-expired") {
            return NextResponse.json(
                { error: "Token expired — please sign in again" },
                { status: 401 }
            );
        }

        if (error.code === "auth/id-token-revoked") {
            return NextResponse.json(
                { error: "Token revoked — please sign in again" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Authentication failed" },
            { status: 401 }
        );
    }
}

/**
 * Require the authenticated user to have a specific role or higher.
 * Returns a 403 response if the user does not have sufficient permissions.
 */
export function requireRole(
    user: User,
    requiredRole: "viewer" | "member" | "admin" | "owner"
): NextResponse | null {
    const roleHierarchy: Record<string, number> = {
        viewer: 1,
        member: 2,
        admin: 3,
        owner: 4,
        platform_admin: 5,
        super_admin: 6,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        return NextResponse.json(
            { error: `Forbidden — requires ${requiredRole} role or higher` },
            { status: 403 }
        );
    }

    return null; // Authorized
}
