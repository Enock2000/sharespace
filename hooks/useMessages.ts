"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/database/schema";
import { ChatMessage, User } from "@/types/database";
import { onValue, ref, query, orderByChild, limitToLast, update } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

export function useMessages(conversationId: string | null) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const usersMapRef = useRef<Record<string, User>>({});

    // Real-time messages listener
    useEffect(() => {
        if (!conversationId) return;
        setLoading(true);
        const rtdb = getFirebaseDatabase();
        const messagesRef = query(
            ref(rtdb, `chat_messages/${conversationId}`),
            orderByChild("timestamp"),
            limitToLast(100)
        );

        const unsub = onValue(messagesRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const msgs = Object.values(data) as ChatMessage[];
                const sorted = msgs
                    .filter(m => !m.deletedForEveryone)
                    .sort((a, b) => a.timestamp - b.timestamp);
                setMessages(sorted);

                // Fetch sender info for new senders
                const senderIds = new Set(sorted.map(m => m.sender_id));
                const newUsers = { ...usersMapRef.current };
                let hasNew = false;
                for (const uid of senderIds) {
                    if (!newUsers[uid]) {
                        const u = await db.get<User>(`users/${uid}`);
                        if (u) { newUsers[uid] = u; hasNew = true; }
                    }
                }
                if (hasNew) {
                    usersMapRef.current = newUsers;
                    setUsersMap(newUsers);
                }
            } else {
                setMessages([]);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [conversationId]);

    // Mark messages as seen when conversation is open
    const markAsSeen = useCallback(() => {
        if (!conversationId || !user) return;
        const rtdb = getFirebaseDatabase();
        // Update the member's lastReadAt
        update(ref(rtdb, `dms/${conversationId}/members_meta/${user.uid}`), {
            lastReadAt: Date.now(),
            unreadCount: 0
        }).catch(() => {});
        // Also store in localStorage for immediate UI feedback
        localStorage.setItem(`last_read_${conversationId}`, Date.now().toString());
    }, [conversationId, user]);

    return { messages, usersMap, loading, markAsSeen };
}
