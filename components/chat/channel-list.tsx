"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { useConversations, EnhancedConversation } from "@/hooks/useConversations";
import { useMultiPresence } from "@/hooks/usePresence";
import { OnlineIndicator } from "./online-indicator";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NewMessageModal } from "./new-message-modal";

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

function getLastMessagePreview(convo: EnhancedConversation, currentUserId: string): string {
    if (!convo.last_message) return "";
    const prefix = convo.last_message.sender_id === currentUserId ? "You: " : "";
    const type = convo.last_message.type;
    if (type === "image") return prefix + "📷 Photo";
    if (type === "video") return prefix + "🎬 Video";
    if (type === "file") return prefix + "📎 File";
    if (type === "voice") return prefix + "🎤 Voice note";
    return prefix + convo.last_message.content;
}

type FilterTab = "all" | "unread" | "groups";

export function ChannelList() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { conversations, loading } = useConversations();
    const [showNewMsg, setShowNewMsg] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<FilterTab>("all");

    // Subscribe to presence for all other users in conversations
    const otherUserIds = conversations
        .map(c => c.otherUser?.id)
        .filter((id): id is string => !!id);
    const presenceMap = useMultiPresence(otherUserIds);

    // Filter conversations based on tab and search
    const filtered = conversations.filter(convo => {
        // Search filter
        if (searchTerm) {
            const name = convo.otherUser ? `${convo.otherUser.first_name} ${convo.otherUser.last_name}` : "";
            if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        }
        // Tab filter
        if (activeTab === "unread") return convo.unreadCount > 0;
        if (activeTab === "groups") return convo.type === "group";
        return true;
    });

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Chats</h1>
                    <button
                        onClick={() => setShowNewMsg(true)}
                        className="w-9 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all hover:scale-105"
                        title="New message"
                    >
                        <Icons.Edit className="w-4 h-4" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search Messenger..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700/50 border-0 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 text-slate-800 dark:text-slate-200 transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1.5">
                    {(["all", "unread", "groups"] as FilterTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                activeTab === tab
                                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                    : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-1">
                {filtered.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                            <Icons.MessageCircle className="w-8 h-8 text-indigo-400 opacity-60" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                            {activeTab === "unread" ? "No unread messages" : "No conversations yet"}
                        </p>
                        <button
                            onClick={() => setShowNewMsg(true)}
                            className="text-sm text-indigo-500 hover:text-indigo-600 font-semibold"
                        >
                            Start a conversation →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {filtered.map(convo => {
                            const isActive = pathname === `/dashboard/chat/dm/${convo.id}`;
                            const otherUser = convo.otherUser;
                            const otherPresence = otherUser ? presenceMap[otherUser.id] : null;
                            const hasUnread = convo.unreadCount > 0;
                            const lastMsgPreview = user ? getLastMessagePreview(convo, user.uid) : "";

                            return (
                                <Link
                                    key={convo.id}
                                    href={`/dashboard/chat/dm/${convo.id}`}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                        isActive
                                            ? "bg-indigo-50 dark:bg-indigo-900/20"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    }`}
                                >
                                    {/* Avatar with online indicator */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${
                                            isActive
                                                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                                : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-600 dark:text-slate-300"
                                        }`}>
                                            {otherUser?.first_name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        {otherPresence && (
                                            <span className="absolute bottom-0 right-0">
                                                <OnlineIndicator
                                                    isOnline={otherPresence.isOnline}
                                                    lastSeen={otherPresence.lastSeen}
                                                    size="md"
                                                />
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-sm truncate ${hasUnread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                                {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "Unknown User"}
                                            </span>
                                            {convo.last_message?.timestamp && (
                                                <span className={`text-[11px] flex-shrink-0 ml-2 ${hasUnread ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-400"}`}>
                                                    {timeAgo(convo.last_message.timestamp)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs truncate pr-2 ${hasUnread ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-400"}`}>
                                                {lastMsgPreview || "Start a conversation"}
                                            </p>
                                            {hasUnread && (
                                                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {convo.unreadCount > 99 ? "99+" : convo.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
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
