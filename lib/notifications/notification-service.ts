import { db } from "@/lib/database/schema";
import { Notification, NotificationType } from "@/types/database";
import { v4 as uuidv4 } from "uuid";


export const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: {
        resourceType?: "file" | "folder" | "user" | "system";
        resourceId?: string;
        actorId?: string;
        actionUrl?: string;
        tenantId?: string;
    }
): Promise<Notification | null> => {
    try {
        // We need tenantId. If not provided, we might need to fetch user to get it.
        // For efficiency, caller should provide it. 
        // If missing, we'll try to fetch user, but that's an extra read.
        let tenantId = metadata?.tenantId;

        if (!tenantId) {
            const user = await db.get<any>(`users/${userId}`);
            if (user) tenantId = user.tenant_id;
        }

        if (!tenantId) {
            console.error("Cannot create notification: missing tenantId");
            return null; // Should not happen if data is consistent
        }

        const notificationId = uuidv4();
        const now = Date.now();

        const notification: Notification = {
            id: notificationId,
            user_id: userId,
            tenant_id: tenantId,
            type,
            title,
            message,
            resource_type: metadata?.resourceType,
            resource_id: metadata?.resourceId,
            actor_id: metadata?.actorId,
            action_url: metadata?.actionUrl,
            is_read: false,
            created_at: now,
        };

        // Store in a list or collection? 
        // Database schema implies `notifications/${userId}/${notificationId}`
        // `tasks.md` or `api/notifications` showed `notifications/${user.id}` returning a Record.
        // So we store it keyed by ID under the user.

        await db.set(`notifications/${userId}/${notificationId}`, notification);

        return notification;
    } catch (error) {
        console.error("Failed to create notification:", error);
        return null;
    }
};

// Optional: cleanup old notifications
export const cleanupNotifications = async (userId: string) => {
    // Implementation to remove old notifications (> 30 days?)
    // Omitted for now unless requested.
};
