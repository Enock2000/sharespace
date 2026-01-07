import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, File, FileComment } from "@/types/database";
import { logEvent } from "@/lib/utils/audit-logger";
import { notifyCommentAdded, notifyMention } from "@/lib/utils/notifications";

// GET - Get comments for a file
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const file = await db.get<File>(`files/${params.id}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Get all comments for this file
        const commentsMap = await db.get<Record<string, FileComment>>(`comments`) || {};
        const fileComments = Object.values(commentsMap)
            .filter(c => c.file_id === params.id)
            .sort((a, b) => a.created_at - b.created_at);

        // Get user info for each comment
        const usersMap = await db.get<Record<string, User>>(`users`) || {};
        const commentsWithUsers = fileComments.map(comment => ({
            ...comment,
            user: usersMap[comment.user_id] ? {
                id: usersMap[comment.user_id].id,
                first_name: usersMap[comment.user_id].first_name,
                last_name: usersMap[comment.user_id].last_name,
                email: usersMap[comment.user_id].email
            } : null
        }));

        return NextResponse.json({ comments: commentsWithUsers });
    } catch (error: any) {
        console.error("Get comments error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Add a comment
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const file = await db.get<File>(`files/${params.id}`);
        if (!file || file.tenant_id !== user.tenant_id) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const body = await request.json();
        const { content, parentId } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: "Content required" }, { status: 400 });
        }

        // Extract mentions (@user)
        const mentionRegex = /@(\w+)/g;
        const mentionMatches = content.match(mentionRegex) || [];
        const mentionUsernames = mentionMatches.map((m: string) => m.slice(1).toLowerCase());

        // Find mentioned users
        const usersMap = await db.get<Record<string, User>>(`users`) || {};
        const mentions: string[] = [];
        Object.values(usersMap).forEach(u => {
            if (u.tenant_id === user.tenant_id) {
                const username = `${u.first_name}${u.last_name}`.toLowerCase();
                if (mentionUsernames.includes(username) || mentionUsernames.includes(u.first_name.toLowerCase())) {
                    mentions.push(u.id);
                }
            }
        });

        const comment: FileComment = {
            id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file_id: params.id,
            user_id: userId,
            content: content.trim(),
            parent_id: parentId || null,
            mentions,
            is_resolved: false,
            created_at: Date.now(),
            updated_at: Date.now()
        };

        await db.set(`comments/${comment.id}`, comment);

        // Notify file owner if they're not the commenter
        if (file.uploaded_by !== userId) {
            await notifyCommentAdded(
                params.id,
                file.name,
                file.uploaded_by,
                userId,
                user.tenant_id,
                content.substring(0, 100)
            );
        }

        // Notify mentioned users
        for (const mentionedUserId of mentions) {
            if (mentionedUserId !== userId) {
                await notifyMention(
                    mentionedUserId,
                    userId,
                    user.tenant_id,
                    `You were mentioned in a comment on "${file.name}"`,
                    params.id
                );
            }
        }

        await logEvent(user.tenant_id, userId, "add_comment", "file", params.id, {
            comment_id: comment.id,
            file_name: file.name
        });

        // Return comment with user info
        return NextResponse.json({
            comment: {
                ...comment,
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email
                }
            }
        });
    } catch (error: any) {
        console.error("Create comment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Delete a comment
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const commentId = searchParams.get("commentId");

    if (!userId || !commentId) {
        return NextResponse.json({ error: "User ID and Comment ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const comment = await db.get<FileComment>(`comments/${commentId}`);
        if (!comment || comment.file_id !== params.id) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Only comment author or admins can delete
        if (comment.user_id !== userId && !["owner", "admin", "super_admin", "platform_admin"].includes(user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await db.remove(`comments/${commentId}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete comment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Update comment (resolve/unresolve)
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const commentId = searchParams.get("commentId");

    if (!userId || !commentId) {
        return NextResponse.json({ error: "User ID and Comment ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const comment = await db.get<FileComment>(`comments/${commentId}`);
        if (!comment || comment.file_id !== params.id) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        const body = await request.json();
        const { is_resolved } = body;

        if (is_resolved !== undefined) {
            await db.update(`comments/${commentId}`, {
                is_resolved,
                updated_at: Date.now()
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update comment error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
