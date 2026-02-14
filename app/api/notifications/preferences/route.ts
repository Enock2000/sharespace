import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/auth-api";
import { db } from "@/lib/database/schema";
import { NotificationPreferences } from "@/types/database";

const DEFAULT_PREFERENCES: NotificationPreferences = {
    user_id: "",
    email_enabled: true,
    push_enabled: false,
    file_shared: true,
    comments: true,
    mentions: true,
    file_updates: true,
    storage_warnings: true,
    marketing: false
};

// GET - Get user preferences
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        let prefs = await db.get<NotificationPreferences>(`notification_preferences/${user.id}`);

        if (!prefs) {
            prefs = { ...DEFAULT_PREFERENCES, user_id: user.id };
            // Optional: db.set to initialize? For now, we just return defaults.
        }

        return NextResponse.json({ preferences: prefs });
    } catch (error: any) {
        console.error("Get preferences error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT - Update user preferences
export async function PUT(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const updates = await request.json();

        // Validate updates? Use Zod if stricter validation needed.
        // For now, simple spread merge.

        let currentPrefs = await db.get<NotificationPreferences>(`notification_preferences/${user.id}`);
        if (!currentPrefs) {
            currentPrefs = { ...DEFAULT_PREFERENCES, user_id: user.id };
        }

        const newPrefs = {
            ...currentPrefs,
            ...updates,
            updated_at: Date.now()
        };

        await db.set(`notification_preferences/${user.id}`, newPrefs);

        return NextResponse.json({ preferences: newPrefs });
    } catch (error: any) {
        console.error("Update preferences error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
