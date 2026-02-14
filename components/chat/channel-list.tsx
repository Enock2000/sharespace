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

function timeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChannelList() {
    const { user } = useAuth();
    const router = useRouter();
    const [channels, setChannels] = useState<ChatChannel[]>([]);
    const [dms, setDms] = useState<(DMConversation & { otherUser?: User })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewMsg, setShowNewMsg] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const pathname = usePathname();

    // Real-time listener for channels and DMs
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const rtdb = getFirebaseDatabase();

        const channelsRef = ref(rtdb, 'chat_channels');
        const unsubChannels = onValue(channelsRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userProfile = await db.get<User>(`users/${user.uid}`);
                if (!userProfile) return;

                const channelsMap = data as Record<string, ChatChannel>;
                const tenantChannels = Object.values(channelsMap)
                    .filter(c => c.tenant_id === userProfile.tenant_id)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setChannels(tenantChannels);
            }
        });

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

    function isUnread(channelId: string, lastMessageAt?: number) {
        if (!lastMessageAt) return false;
        if (pathname?.includes(channelId)) return false;
        const lastRead = localStorage.getItem(`last_read_${channelId}`);
        if (!lastRead) return true;
        return lastMessageAt > parseInt(lastRead);
    }

    const filteredChannels = searchTerm
        ? channels.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : channels;

    const filteredDms = searchTerm
        ? dms.filter(dm => {
            const name = dm.otherUser ? `${dm.otherUser.first_name} ${dm.otherUser.last_name}` : "";
            return name.toLowerCase().includes(searchTerm.toLowerCase());
        })
        : dms;

    if (loading) {
        return (
            <div className="p-4 space-y-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-3 p-2">
                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm">Messages</h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`p-1.5 rounded-lg transition-colors ${showSearch ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                        >
                            <Icons.Search className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowNewMsg(true)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                            <Icons.Edit className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <div className="relative animate-in slide-in-from-top-1 duration-150">
                        <Icons.Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                {/* Channels Section */}
                <div>
                    <div className="px-2 mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Channels</span>
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                            <Icons.Plus className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-0.5">
                        {filteredChannels.map(channel => {
                            const isActive = pathname === `/dashboard/chat/channels/${channel.id}`;
                            const unread = isUnread(channel.id, channel.last_message_at);

                            return (
                                <Link
                                    key={channel.id}
                                    href={`/dashboard/chat/channels/${channel.id}`}
                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${isActive
                                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 text-indigo-700 dark:text-white shadow-sm"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${isActive
                                        ? "bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        }`}>
                                        #
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`truncate text-sm ${unread ? "font-bold" : "font-medium"}`}>{channel.name}</span>
                                            {channel.last_message_at && (
                                                <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                                                    {timeAgo(channel.last_message_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {unread && (
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Direct Messages Section */}
                <div>
                    <div className="px-2 mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Messages</span>
                        <button
                            onClick={() => setShowNewMsg(true)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <Icons.Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {filteredDms.length === 0 ? (
                        <div className="px-3 py-8 text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                <Icons.MessageCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-xs text-slate-400">No conversations yet</p>
                            <button
                                onClick={() => setShowNewMsg(true)}
                                className="mt-2 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                            >
                                Start a chat →
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredDms.map(dm => {
                                const isActive = pathname === `/dashboard/chat/dm/${dm.id}`;
                                const isExternal = dm.otherUser?.tenant_id && user && dm.participants_tenants && dm.participants_tenants[user.uid] !== dm.otherUser.tenant_id;
                                const unread = isUnread(dm.id, dm.updated_at);
                                const lastMsg = (dm as any).last_message;

                                return (
                                    <Link
                                        key={dm.id}
                                        href={`/dashboard/chat/dm/${dm.id}`}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${isActive
                                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/20 shadow-sm"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        {/* Avatar with online indicator */}
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${isActive
                                                ? "bg-gradient-to-br from-indigo-400 to-purple-500 text-white"
                                                : isExternal
                                                    ? "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400"
                                                    : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-600 dark:text-slate-300"
                                                }`}>
                                                {dm.otherUser?.first_name?.[0]?.toUpperCase() || "?"}
                                            </div>
                                            {isExternal && (
                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-400 rounded-full border-2 border-white dark:border-slate-800" title="External" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`truncate text-sm ${isActive ? "text-indigo-700 dark:text-white" : "text-slate-700 dark:text-slate-300"} ${unread ? "font-bold" : "font-medium"}`}>
                                                    {dm.otherUser ? `${dm.otherUser.first_name} ${dm.otherUser.last_name}` : "Unknown User"}
                                                </span>
                                                {dm.updated_at && (
                                                    <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                                                        {timeAgo(dm.updated_at)}
                                                    </span>
                                                )}
                                            </div>
                                            {lastMsg && (
                                                <p className={`text-xs truncate mt-0.5 ${unread ? "text-slate-600 dark:text-slate-400 font-medium" : "text-slate-400"}`}>
                                                    {lastMsg.content}
                                                </p>
                                            )}
                                        </div>

                                        {unread && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 animate-pulse" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
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
