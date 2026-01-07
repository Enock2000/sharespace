import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, Notification } from "@/types/database";

// GET - List notifications for user
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all notifications for this user
        const notificationsMap = await db.get<Record<string, Notification>>(`notifications`) || {};
        let userNotifications = Object.values(notificationsMap)
            .filter(n => n.user_id === userId)
            .sort((a, b) => b.created_at - a.created_at);

        if (unreadOnly) {
            userNotifications = userNotifications.filter(n => !n.is_read);
        }

        const unreadCount = Object.values(notificationsMap)
            .filter(n => n.user_id === userId && !n.is_read).length;

        return NextResponse.json({
            notifications: userNotifications.slice(0, limit),
            unread_count: unreadCount,
            total: userNotifications.length
        });
    } catch (error: any) {
        console.error("Get notifications error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Mark notifications as read
export async function PATCH(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const notificationId = searchParams.get("id");
    const markAllRead = searchParams.get("markAllRead") === "true";

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (markAllRead) {
            // Mark all notifications as read
            const notificationsMap = await db.get<Record<string, Notification>>(`notifications`) || {};
            const userNotifications = Object.entries(notificationsMap)
                .filter(([_, n]) => n.user_id === userId && !n.is_read);

            for (const [id, _] of userNotifications) {
                await db.update(`notifications/${id}`, { is_read: true });
            }

            return NextResponse.json({ success: true, updated: userNotifications.length });
        } else if (notificationId) {
            // Mark single notification as read
            const notification = await db.get<Notification>(`notifications/${notificationId}`);
            if (!notification || notification.user_id !== userId) {
                return NextResponse.json({ error: "Notification not found" }, { status: 404 });
            }

            await db.update(`notifications/${notificationId}`, { is_read: true });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing id or markAllRead parameter" }, { status: 400 });
    } catch (error: any) {
        console.error("Update notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete notifications
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const notificationId = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (deleteAll) {
            // Delete all notifications for user
            const notificationsMap = await db.get<Record<string, Notification>>(`notifications`) || {};
            const userNotifications = Object.entries(notificationsMap)
                .filter(([_, n]) => n.user_id === userId);

            for (const [id, _] of userNotifications) {
                await db.remove(`notifications/${id}`);
            }

            return NextResponse.json({ success: true, deleted: userNotifications.length });
        } else if (notificationId) {
            // Delete single notification
            const notification = await db.get<Notification>(`notifications/${notificationId}`);
            if (!notification || notification.user_id !== userId) {
                return NextResponse.json({ error: "Notification not found" }, { status: 404 });
            }

            await db.remove(`notifications/${notificationId}`);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Missing id or deleteAll parameter" }, { status: 400 });
    } catch (error: any) {
        console.error("Delete notification error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
