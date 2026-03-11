"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { db } from "@/lib/database/schema";
import { DMConversation, User, UserPresence } from "@/types/database";
import { onValue, ref } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

export interface EnhancedConversation extends DMConversation {
    otherUser?: User;
    otherUserPresence?: UserPresence;
    unreadCount: number;
}

export function useConversations() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<EnhancedConversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const rtdb = getFirebaseDatabase();
        const dmsRef = ref(rtdb, 'dms');

        const unsub = onValue(dmsRef, async (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const dmsMap = data as Record<string, DMConversation>;
            const myDms = Object.values(dmsMap).filter(dm => dm.participants.includes(user.uid));

            const enhanced: EnhancedConversation[] = await Promise.all(
                myDms.map(async (dm) => {
                    const otherUserId = dm.participants.find(p => p !== user.uid) || user.uid;
                    const otherUser = await db.get<User>(`users/${otherUserId}`);
                    const memberMeta = dm.members_meta?.[user.uid];
                    return {
                        ...dm,
                        otherUser: otherUser || undefined,
                        unreadCount: memberMeta?.unreadCount || 0,
                    };
                })
            );

            // Sort: pinned first, then by updated_at descending
            enhanced.sort((a, b) => {
                const aPinned = a.members_meta?.[user.uid]?.isPinned ? 1 : 0;
                const bPinned = b.members_meta?.[user.uid]?.isPinned ? 1 : 0;
                if (aPinned !== bPinned) return bPinned - aPinned;
                return (b.updated_at || b.created_at) - (a.updated_at || a.created_at);
            });

            setConversations(enhanced);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    return { conversations, loading };
}
