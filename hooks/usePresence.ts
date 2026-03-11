"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { UserPresence } from "@/types/database";
import { onValue, ref, set, onDisconnect, remove, serverTimestamp } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

export function usePresence() {
    const { user } = useAuth();

    // Set current user online + auto-offline on disconnect
    useEffect(() => {
        if (!user) return;
        const rtdb = getFirebaseDatabase();
        const presenceRef = ref(rtdb, `presence/${user.uid}`);

        // Set online
        set(presenceRef, {
            isOnline: true,
            lastSeen: Date.now(),
        });

        // On disconnect, set offline
        onDisconnect(presenceRef).set({
            isOnline: false,
            lastSeen: Date.now(),
        });

        return () => {
            set(presenceRef, {
                isOnline: false,
                lastSeen: Date.now(),
            });
        };
    }, [user]);

    return null;
}

/** Subscribe to a single user's presence */
export function useUserPresence(userId: string | null) {
    const [presence, setPresence] = useState<UserPresence | null>(null);

    useEffect(() => {
        if (!userId) return;
        const rtdb = getFirebaseDatabase();
        const presenceRef = ref(rtdb, `presence/${userId}`);

        const unsub = onValue(presenceRef, (snapshot) => {
            const data = snapshot.val();
            setPresence(data || null);
        });

        return () => unsub();
    }, [userId]);

    return presence;
}

/** Subscribe to multiple users' presence */
export function useMultiPresence(userIds: string[]) {
    const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

    useEffect(() => {
        if (userIds.length === 0) return;
        const rtdb = getFirebaseDatabase();
        const unsubs: (() => void)[] = [];

        for (const uid of userIds) {
            const presenceRef = ref(rtdb, `presence/${uid}`);
            const unsub = onValue(presenceRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setPresenceMap(prev => ({ ...prev, [uid]: data }));
                }
            });
            unsubs.push(unsub);
        }

        return () => unsubs.forEach(u => u());
    }, [userIds.join(",")]);

    return presenceMap;
}

/** Typing indicator management */
export function useTyping(conversationId: string | null) {
    const { user } = useAuth();
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    // Listen for typing users
    useEffect(() => {
        if (!conversationId || !user) return;
        const rtdb = getFirebaseDatabase();
        const typingRef = ref(rtdb, `chat_typing/${conversationId}`);

        const unsub = onValue(typingRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const now = Date.now();
                const typing = Object.entries(data)
                    .filter(([uid, ts]) => uid !== user.uid && (now - (ts as number)) < 5000)
                    .map(([uid]) => uid);
                setTypingUsers(typing);
            } else {
                setTypingUsers([]);
            }
        });

        return () => unsub();
    }, [conversationId, user]);

    // Set typing indicator
    const setTyping = useCallback(() => {
        if (!conversationId || !user) return;
        const rtdb = getFirebaseDatabase();
        set(ref(rtdb, `chat_typing/${conversationId}/${user.uid}`), Date.now());
    }, [conversationId, user]);

    // Clear typing on unmount
    useEffect(() => {
        return () => {
            if (conversationId && user) {
                const rtdb = getFirebaseDatabase();
                remove(ref(rtdb, `chat_typing/${conversationId}/${user.uid}`));
            }
        };
    }, [conversationId, user]);

    return { typingUsers, setTyping };
}
