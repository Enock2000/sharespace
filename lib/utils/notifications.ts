import { db } from "@/lib/database/schema";
import { Notification, NotificationType } from "@/types/database";

// Create a new notification
export async function createNotification({
    userId,
    tenantId,
    type,
    title,
    message,
    resourceType,
    resourceId,
    actorId,
    actionUrl
}: {
    userId: string;
    tenantId: string;
    type: NotificationType;
    title: string;
    message: string;
    resourceType?: "file" | "folder" | "user" | "system";
    resourceId?: string;
    actorId?: string;
    actionUrl?: string;
}): Promise<Notification> {
    const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        tenant_id: tenantId,
        type,
        title,
        message,
        resource_type: resourceType,
        resource_id: resourceId,
        actor_id: actorId,
        is_read: false,
        created_at: Date.now(),
        action_url: actionUrl
    };

    await db.set(`notifications/${notification.id}`, notification);
    return notification;
}

// Create notifications for file share
export async function notifyFileShared(
    fileId: string,
    fileName: string,
    sharedWithUserId: string,
    sharedByUserId: string,
    tenantId: string
) {
    return createNotification({
        userId: sharedWithUserId,
        tenantId,
        type: "file_shared",
        title: "File shared with you",
        message: `A file "${fileName}" has been shared with you`,
        resourceType: "file",
        resourceId: fileId,
        actorId: sharedByUserId,
        actionUrl: `/dashboard/files?preview=${fileId}`
    });
}

// Create notifications for comments
export async function notifyCommentAdded(
    fileId: string,
    fileName: string,
    fileOwnerId: string,
    commenterId: string,
    tenantId: string,
    commentPreview: string
) {
    return createNotification({
        userId: fileOwnerId,
        tenantId,
        type: "comment_added",
        title: "New comment on your file",
        message: `Someone commented on "${fileName}": ${commentPreview.substring(0, 50)}...`,
        resourceType: "file",
        resourceId: fileId,
        actorId: commenterId,
        actionUrl: `/dashboard/files?preview=${fileId}&comments=true`
    });
}

// Create notifications for mentions
export async function notifyMention(
    mentionedUserId: string,
    mentionedByUserId: string,
    tenantId: string,
    context: string,
    fileId: string
) {
    return createNotification({
        userId: mentionedUserId,
        tenantId,
        type: "mention",
        title: "You were mentioned",
        message: context,
        resourceType: "file",
        resourceId: fileId,
        actorId: mentionedByUserId,
        actionUrl: `/dashboard/files?preview=${fileId}&comments=true`
    });
}

// Create storage warning notification
export async function notifyStorageWarning(
    userId: string,
    tenantId: string,
    usedPercentage: number
) {
    return createNotification({
        userId,
        tenantId,
        type: "storage_warning",
        title: "Storage almost full",
        message: `You've used ${usedPercentage}% of your storage quota. Consider upgrading or deleting unused files.`,
        resourceType: "system",
        actionUrl: "/dashboard/billing"
    });
}

// Create system notification
export async function notifySystem(
    userId: string,
    tenantId: string,
    title: string,
    message: string,
    actionUrl?: string
) {
    return createNotification({
        userId,
        tenantId,
        type: "system",
        title,
        message,
        resourceType: "system",
        actionUrl
    });
}
