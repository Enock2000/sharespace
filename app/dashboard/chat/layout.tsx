"use client";

import { usePresence } from "@/hooks/usePresence";
import { ChannelList } from "@/components/chat/channel-list";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    // Initialize presence tracking for the current user
    usePresence();

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            {/* Sidebar – Conversation List */}
            <div className="w-[350px] border-r border-slate-200 dark:border-slate-700 flex-shrink-0 hidden lg:flex flex-col bg-white dark:bg-slate-800">
                <ChannelList />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {children}
            </div>
        </div>
    );
}
