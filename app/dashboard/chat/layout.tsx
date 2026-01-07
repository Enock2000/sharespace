"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { ChannelList } from "@/components/chat/channel-list";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-[calc(100vh-6rem)] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900 dark:text-white">Messages</h2>
                    <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                        <Icons.Edit className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <ChannelList />
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800">
                {children}
            </div>
        </div>
    );
}
