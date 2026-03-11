"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ChatMessageType } from "@/types/database";
import { ref, set, update, remove, get } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

interface SendMessageOptions {
    content: string;
    type?: ChatMessageType;
    replyTo?: { id: string; content: string; sender_id: string };
    fileAttachment?: {
        name: string;
        url: string;
        size: number;
        type: string;
        thumbnailUrl?: string;
    };
}

export function useSendMessage(conversationId: string | null) {
    const { user } = useAuth();
    const [sending, setSending] = useState(false);

    const sendMessage = useCallback(async (options: SendMessageOptions) => {
        if (!user || !conversationId || sending) return;
        const { content, type = "text", replyTo, fileAttachment } = options;
        if (!content.trim() && !fileAttachment) return;

        setSending(true);
        try {
            const rtdb = getFirebaseDatabase();
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newMessage: any = {
                id: messageId,
                conversation_id: conversationId,
                sender_id: user.uid,
                content,
                timestamp: Date.now(),
                type,
            };

            if (replyTo) {
                newMessage.reply_to = replyTo;
            }

            if (fileAttachment) {
                newMessage.file_attachment = fileAttachment;
            }

            // Atomic multi-path update
            const updates: Record<string, any> = {};
            updates[`chat_messages/${conversationId}/${messageId}`] = newMessage;
            updates[`dms/${conversationId}/last_message`] = {
                content: type === 'image' ? '📷 Photo' : type === 'file' ? '📎 File' : content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                sender_id: user.uid,
                timestamp: newMessage.timestamp,
                type,
            };
            updates[`dms/${conversationId}/updated_at`] = newMessage.timestamp;

            await update(ref(rtdb), updates);

            // Increment unread count for other participants
            const convoSnap = await get(ref(rtdb, `dms/${conversationId}/participants`));
            const participants: string[] = convoSnap.val() || [];
            for (const pid of participants) {
                if (pid !== user.uid) {
                    const unreadRef = ref(rtdb, `dms/${conversationId}/members_meta/${pid}/unreadCount`);
                    const snap = await get(unreadRef);
                    const current = snap.val() || 0;
                    await set(unreadRef, current + 1);
                }
            }

            // Clear typing indicator
            remove(ref(rtdb, `chat_typing/${conversationId}/${user.uid}`));

        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    }, [user, conversationId, sending]);

    return { sendMessage, sending };
}
