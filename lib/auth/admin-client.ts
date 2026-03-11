"use client";

import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, get } from "firebase/database";

/**
 * Helper function to get user role from database (client-side)
 */
export async function getUserRoleClient(userId: string): Promise<string | null> {
    try {
        console.log(`[getUserRoleClient] Initializing database for user ${userId}...`);
        const db = getFirebaseDatabase();
        const userRef = ref(db, `users/${userId}`);
        
        console.log(`[getUserRoleClient] Calling get() on users/${userId}...`);
        
        // Add a safety timeout specifically for the database call since it might be hanging
        const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error("Firebase Database get() timed out after 8s")), 8000)
        );
        
        const snapshot = await Promise.race([
            get(userRef),
            timeoutPromise
        ]);

        console.log(`[getUserRoleClient] get() returned. exists:`, snapshot?.exists?.());
        
        if (!snapshot || !snapshot.exists()) {
            return null;
        }

        const role = snapshot.val().role;
        console.log(`[getUserRoleClient] found role: ${role}`);
        return role || null;
    } catch (error) {
        console.error("[getUserRoleClient] Error fetching user role:", error);
        return null;
    }
}

/**
 * Check if user is platform admin (client-side)
 */
export async function isPlatformAdminClient(userId: string): Promise<boolean> {
    const role = await getUserRoleClient(userId);
    console.log(`[isPlatformAdminClient] Checking role for ${userId}:`, role); // DEBUG LOG
    return role === "platform_admin" || role === "super_admin";
}
