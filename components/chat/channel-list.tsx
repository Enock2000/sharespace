"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { db } from "@/lib/database/schema";
import { ChatChannel, User, DMConversation } from "@/types/database";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NewMessageModal } from "./new-message-modal";
import { onValue, ref } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

export function ChannelList() {
    const { user } = useAuth();
    const router = useRouter();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [dms, setDms] = useState<(DMConversation & { otherUser?: User })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewMsg, setShowNewMsg] = useState(false);
    const pathname = usePathname();

    // Real-time listener for channels and DMs
    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const rtdb = getFirebaseDatabase();

        // Listen for channels
        const channelsRef = ref(rtdb, 'chat_channels');
        const unsubChannels = onValue(channelsRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // We need to fetch user profile to check tenant_id, but we can't do async inside onValue easily
                // So we do a quick check if we have the profile loaded
                // Better approach: fetch user profile once, then set up listener.
                // Assuming userProfile is loaded or we re-fetch it.
                const userProfile = await db.get<User>(`users/${user.uid}`);
                if (!userProfile) return;

                const channelsMap = data as Record<string, ChatChannel>;
                const tenantChannels = Object.values(channelsMap)
                    .filter(c => c.tenant_id === userProfile.tenant_id)
                    .sort((a, b) => a.name.localeCompare(b.name));

                // Force create general if missing (optional, maybe skip for real-time to avoid loops)
                setChannels(tenantChannels);
            }
        });

        // Listen for DMs
        // NOTE: Monitoring ALL DMs is inefficient. Ideally we index by participant.
        // For this demo with few DMs it's fine.
        const dmsRef = ref(rtdb, 'dms');
        const unsubDms = onValue(dmsRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dmsMap = data as Record<string, DMConversation>;
                const myDms = Object.values(dmsMap).filter(dm => dm.participants.includes(user.uid));

                const enhancedDms = await Promise.all(myDms.map(async (dm) => {
                    const otherUserId = dm.participants.find(p => p !== user.uid) || user.uid;
                    const otherUser = await db.get<User>(`users/${otherUserId}`);
                    return { ...dm, otherUser: otherUser || undefined };
                }));

                setDms(enhancedDms.sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at)));
            }
            setLoading(false);
        });

        return () => {
            unsubChannels();
            unsubDms();
        };
    }, [user]);

    // Helper to check unread
    function isUnread(channelId: string, lastMessageAt?: number) {
        if (!lastMessageAt) return false;
        // Ignore if currently on that channel
        if (pathname?.includes(channelId)) return false;

        const lastRead = localStorage.getItem(`last_read_${channelId}`);
        if (!lastRead) return true; // Never read
        return lastMessageAt > parseInt(lastRead);
    }

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-3">
            {/* Channels Section */}
            <div>
                <div className="px-3 mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Channels</span>
                    <button className="hover:text-slate-900 dark:hover:text-slate-300">
                        <Icons.Plus className="w-3 h-3" />
                    </button>
                </div>
                <div className="space-y-0.5">
                    {channels.map(channel => {
                        const isActive = pathname === `/dashboard/chat/channels/${channel.id}`;
                        const unread = isUnread(channel.id, channel.last_message_at);

                        return (
                            <Link
                                key={channel.id}
                                href={`/dashboard/chat/channels/${channel.id}`}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-white font-medium"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="opacity-70">#</span>
                                    {channel.name}
                                </div>
                                {unread && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500" title="New messages" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Direct Messages Section */}
            <div>
                <div className="px-3 mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Direct Messages</span>
                    <button
                        onClick={() => setShowNewMsg(true)}
                        className="hover:text-slate-900 dark:hover:text-slate-300"
                    >
                        <Icons.Plus className="w-3 h-3" />
                    </button>
                </div>
                {dms.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                        <p className="text-xs text-slate-400 italic">No recent chats</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {dms.map(dm => {
                            const isActive = pathname === `/dashboard/chat/dm/${dm.id}`;
                            const isExternal = dm.otherUser?.tenant_id && user && dm.participants_tenants && dm.participants_tenants[user.uid] !== dm.otherUser.tenant_id;
                            const unread = isUnread(dm.id, dm.updated_at);

                            return (
                                <Link
                                    key={dm.id}
                                    href={`/dashboard/chat/dm/${dm.id}`}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-white font-medium"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isExternal ? "bg-orange-400" : "bg-green-400"}`} />
                                        <span className="truncate">
                                            {dm.otherUser ? `${dm.otherUser.first_name} ${dm.otherUser.last_name}` : "Unknown User"}
                                            {isExternal && <span className="ml-1 text-[10px] text-slate-400 border border-slate-200 rounded px-1">EXT</span>}
                                        </span>
                                    </div>
                                    {unread && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500" title="New messages" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <NewMessageModal
                isOpen={showNewMsg}
                onClose={() => setShowNewMsg(false)}
                onStartChat={async (uid, email) => {
                    if (!user) return;
                    try {
                        const res = await fetch("/api/chat/dm", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                currentUserId: user.uid,
                                targetUserId: uid,
                                targetEmail: email
                            })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setShowNewMsg(false);
                            // Real-time listener will pick up the new DM
                            router.push(`/dashboard/chat/dm/${data.conversation.id}`);
                        } else {
                            const err = await res.json();
                            alert(err.error || "Failed to start chat");
                        }
                    } catch (e) {
                        alert("Failed to start chat");
                    }
                }}
            />
        </div>
    );
}
