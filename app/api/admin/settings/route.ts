import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Import database
        const { getFirebaseDatabase } = await import("@/lib/firebase-config");
        const { ref, get } = await import("firebase/database");

        const db = getFirebaseDatabase();
        const settingsRef = ref(db, "platform_settings");
        const snapshot = await get(settingsRef);

        if (!snapshot.exists()) {
            // Return default settings
            return NextResponse.json({
                free_trial_days: 14,
                default_user_limit: 50,
                default_storage_quota: 250 * 1024 * 1024 * 1024,
            });
        }

        return NextResponse.json(snapshot.val());
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Import database
        const { getFirebaseDatabase } = await import("@/lib/firebase-config");
        const { ref, set } = await import("firebase/database");

        const db = getFirebaseDatabase();
        const settingsRef = ref(db, "platform_settings");
        await set(settingsRef, body);

        // Log the action
        const { logAdminAction } = await import("@/lib/auth/admin-middleware");
        // We need a user ID for logging, but in this context we might not have it easily available
        // without parsing the token again. For now, we'll use "system" or try to get it from headers if needed.
        // Ideally, this route should be protected by middleware that passes the user.

        await logAdminAction(
            "system", // Placeholder, should be actual admin ID
            "system",
            "settings_update",
            "settings",
            undefined,
            { settings: body }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving settings:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}
