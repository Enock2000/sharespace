import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { Notification } from "@/types/database";
import { authenticateRequest } from "@/lib/auth/auth-api";

export const dynamic = 'force-dynamic';

// GET - List notifications
export async function GET(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    try {
        const notificationsMap = await db.get<Record<string, Notification>>(`notifications/${user.id}`) || {};
        let notifications = Object.values(notificationsMap)
            .sort((a, b) => b.created_at - a.created_at);

        if (unreadOnly) {
            notifications = notifications.filter(n => !n.is_read);
        }

        notifications = notifications.slice(0, limit);

        const unreadCount = Object.values(notificationsMap).filter(n => !n.is_read).length;

        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        console.error("Get notifications error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Mark notifications as read
export async function PATCH(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    try {
        const { notificationId, markAll } = await request.json();

        if (markAll) {
            const notificationsMap = await db.get<Record<string, Notification>>(`notifications/${user.id}`) || {};
            for (const [key, notification] of Object.entries(notificationsMap)) {
                if (!notification.is_read) {
                    await db.update(`notifications/${user.id}/${key}`, { is_read: true });
                }
            }
            return NextResponse.json({ success: true, message: "All marked as read" });
        }

        if (!notificationId) {
            return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
        }

        await db.update(`notifications/${user.id}/${notificationId}`, { is_read: true });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Mark notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete notifications
export async function DELETE(request: Request) {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("notificationId");
    const deleteAll = searchParams.get("all") === "true";

    try {
        if (deleteAll) {
            await db.remove(`notifications/${user.id}`);
            return NextResponse.json({ success: true, message: "All notifications deleted" });
        }

        if (!notificationId) {
            return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
        }

        await db.remove(`notifications/${user.id}/${notificationId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
