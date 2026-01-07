"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { db } from "@/lib/database/schema";
import { ChatChannel, User, DMConversation } from "@/types/database";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NewMessageModal } from "./new-message-modal";

export function ChannelList() {
    const { user } = useAuth();
    const router = useRouter();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [dms, setDms] = useState<(DMConversation & { otherUser?: User })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewMsg, setShowNewMsg] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (user) {
            fetchChannels();
        }
    }, [user]);

    const fetchChannels = async () => {
        if (!user) return;
        try {
            // Get user profile for tenant_id
            const userProfile = await db.get<User>(`users/${user.uid}`);
            if (!userProfile) return;

            // Fetch channels
            const channelsMap = await db.get<Record<string, ChatChannel>>(`chat_channels`) || {};
            const tenantChannels = Object.values(channelsMap)
                .filter(c => c.tenant_id === userProfile.tenant_id)
                .sort((a, b) => a.name.localeCompare(b.name));

            // Fetch DMs
            // Inefficient scan again. In prod use index.
            const dmsMap = await db.get<Record<string, DMConversation>>(`dms`) || {};
            const myDms = Object.values(dmsMap).filter(dm => dm.participants.includes(user.uid));

            // Enhance DMs with Other User Info
            const enhancedDms = await Promise.all(myDms.map(async (dm) => {
                const otherUserId = dm.participants.find(p => p !== user.uid) || user.uid; // fallback self?
                const otherUser = await db.get<User>(`users/${otherUserId}`);
                return { ...dm, otherUser: otherUser || undefined };
            }));

            // Ensure #general exists
            if (!tenantChannels.find(c => c.name === "general")) {
                await createGeneralChannel(userProfile.tenant_id, user.uid);
                // Re-fetch or manually add
                // For simplicity, re-fetch
                const updatedMap = await db.get<Record<string, ChatChannel>>(`chat_channels`) || {};
                const updatedChannels = Object.values(updatedMap)
                    .filter(c => c.tenant_id === userProfile.tenant_id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setChannels(updatedChannels);
            } else {
                setChannels(tenantChannels);
            }

            setDms(enhancedDms.sort((a, b) => b.updated_at - a.updated_at));
        } catch (error) {
            console.error("Failed to fetch channels", error);
        } finally {
            setLoading(false);
        }
    };

    const createGeneralChannel = async (tenantId: string, userId: string) => {
        const id = `channel_${tenantId}_general`;
        const channel: ChatChannel = {
            id,
            tenant_id: tenantId,
            name: "general",
            type: "public",
            created_by: userId,
            created_at: Date.now()
        };
        await db.set(`chat_channels/${id}`, channel);
    };

    if (loading) {
        return <div className="p-4 text-center text-xs text-slate-500">Loading channels...</div>;
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
                        return (
                            <Link
                                key={channel.id}
                                href={`/dashboard/chat/channels/${channel.id}`}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-white font-medium"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="opacity-70">#</span>
                                {channel.name}
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

                            return (
                                <Link
                                    key={dm.id}
                                    href={`/dashboard/chat/dm/${dm.id}`}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-white font-medium"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isExternal ? "bg-orange-400" : "bg-green-400"}`} />
                                    <span className="truncate flex-1">
                                        {dm.otherUser ? `${dm.otherUser.first_name} ${dm.otherUser.last_name}` : "Unknown User"}
                                        {isExternal && <span className="ml-1 text-[10px] text-slate-400 border border-slate-200 rounded px-1">EXT</span>}
                                    </span>
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
                            fetchChannels(); // refresh DMs
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
