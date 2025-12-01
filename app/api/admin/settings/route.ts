import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        // Import database
        const { db } = await import("@/lib/database/schema");
        const { ref, get } = await import("firebase/database");

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
        const { db } = await import("@/lib/database/schema");
        const { ref, set } = await import("firebase/database");

        const settingsRef = ref(db, "platform_settings");
        await set(settingsRef, body);

        // Log the action
        const { logAdminAction } = await import("@/lib/auth/admin-middleware");
        await logAdminAction(
            "system",
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
