"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { User, UserPresence } from "@/types/database";
import { OnlineIndicator, formatLastSeen } from "./online-indicator";

interface ChatInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    otherUser?: User | null;
    presence?: UserPresence | null;
    onMute?: () => void;
    onBlock?: () => void;
    onClearChat?: () => void;
    isMuted?: boolean;
}

export function ChatInfoPanel({ isOpen, onClose, otherUser, presence, onMute, onBlock, onClearChat, isMuted }: ChatInfoPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Chat Info</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                    <Icons.X className="w-4 h-4" />
                </button>
            </div>

            {/* User Info */}
            <div className="p-6 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-700">
                <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
                        {otherUser?.first_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    {presence && (
                        <span className="absolute bottom-1 right-1">
                            <OnlineIndicator isOnline={presence.isOnline} lastSeen={presence.lastSeen} size="lg" />
                        </span>
                    )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                    {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "Unknown"}
                </h4>
                <p className="text-sm text-slate-500 mt-0.5">{otherUser?.email}</p>
                {presence && (
                    <span className={`text-xs mt-1 ${presence.isOnline ? "text-emerald-500" : "text-slate-400"}`}>
                        {presence.isOnline ? "Active now" : presence.lastSeen ? formatLastSeen(presence.lastSeen) : "Offline"}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="p-3 space-y-0.5">
                <button
                    onClick={onMute}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                    {isMuted ? (
                        <Icons.Bell className="w-4 h-4 text-slate-400" />
                    ) : (
                        <Icons.BellOff className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                        {isMuted ? "Unmute conversation" : "Mute conversation"}
                    </span>
                </button>
                <button
                    onClick={onBlock}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                    <Icons.Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Block user</span>
                </button>
                <button
                    onClick={onClearChat}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                >
                    <Icons.Trash className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400">Clear chat</span>
                </button>
            </div>
        </div>
    );
}
