"use client";

import { ChatMessage, User } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { SeenStatus } from "./seen-status";
import { ReactionPicker } from "./emoji-picker";
import { useState } from "react";

interface MessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
    showAvatar: boolean;
    showTimestamp: boolean;
    senderName: string;
    senderInitial: string;
    isLastOutgoing?: boolean;
    seenState?: "sending" | "sent" | "delivered" | "seen";
    seenByInitial?: string;
    onReply?: (msg: ChatMessage) => void;
    onReact?: (msgId: string, emoji: string) => void;
    onDelete?: (msgId: string) => void;
    onEdit?: (msg: ChatMessage) => void;
    usersMap?: Record<string, User>;
}

export function MessageBubble({
    message,
    isOwn,
    showAvatar,
    showTimestamp,
    senderName,
    senderInitial,
    isLastOutgoing,
    seenState,
    seenByInitial,
    onReply,
    onReact,
    onDelete,
    onEdit,
    usersMap,
}: MessageBubbleProps) {
    const [showActions, setShowActions] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    // System message
    if (message.type === "system") {
        return (
            <div className="flex justify-center py-2">
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    {message.content}
                </span>
            </div>
        );
    }

    const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;

    return (
        <div
            className={`group flex ${isOwn ? "justify-end" : "justify-start"} ${showAvatar ? "mt-3" : "mt-0.5"} px-3 relative`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}
        >
            {/* Avatar (incoming only) */}
            {!isOwn && (
                <div className="w-8 flex-shrink-0 mr-2 self-end">
                    {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                            {senderInitial}
                        </div>
                    ) : null}
                </div>
            )}

            <div className={`max-w-[70%] min-w-[60px] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {/* Sender name for incoming */}
                {!isOwn && showAvatar && (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5 ml-1">
                        {senderName}
                    </span>
                )}

                {/* Reply preview */}
                {message.reply_to && (
                    <div className={`mb-0.5 px-3 py-1.5 rounded-lg text-xs ${isOwn ? "bg-indigo-400/20 text-indigo-100" : "bg-slate-100 dark:bg-slate-700/50 text-slate-500"} max-w-full`}>
                        <span className="font-medium">{usersMap?.[message.reply_to.sender_id]?.first_name || "User"}</span>
                        <p className="truncate opacity-80">{message.reply_to.content}</p>
                    </div>
                )}

                {/* Bubble */}
                <div
                    className={`relative px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isOwn
                            ? `bg-gradient-to-br from-indigo-500 to-purple-600 text-white ${showAvatar ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-br-sm"}`
                            : `bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 ${showAvatar ? "rounded-2xl rounded-bl-sm" : "rounded-2xl rounded-bl-sm"}`
                    } shadow-sm`}
                >
                    {/* Image message */}
                    {message.type === "image" && message.file_attachment && (
                        <div className="mb-1.5 -mx-1.5 -mt-0.5 overflow-hidden rounded-xl">
                            <img
                                src={message.file_attachment.url}
                                alt={message.file_attachment.name}
                                className="max-w-full max-h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </div>
                    )}

                    {/* File message */}
                    {message.type === "file" && message.file_attachment && (
                        <a
                            href={message.file_attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isOwn ? "bg-white/10 hover:bg-white/20" : "bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500"} transition-colors`}
                        >
                            <Icons.File className="w-5 h-5 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{message.file_attachment.name}</p>
                                <p className="text-[10px] opacity-60">{(message.file_attachment.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </a>
                    )}

                    {/* Text content */}
                    {message.content && <span>{message.content}</span>}

                    {/* Edited indicator */}
                    {message.edited && (
                        <span className={`text-[10px] ml-1.5 ${isOwn ? "text-white/50" : "text-slate-400"} italic`}>
                            (edited)
                        </span>
                    )}

                    {/* Timestamp inside bubble */}
                    {showTimestamp && (
                        <span className={`block text-[10px] mt-1 ${isOwn ? "text-white/50 text-right" : "text-slate-400"}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>

                {/* Reactions */}
                {hasReactions && (
                    <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                        {Object.entries(message.reactions!).map(([emoji, users]) => (
                            <button
                                key={emoji}
                                onClick={() => onReact?.(message.id, emoji)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow transition-all"
                            >
                                <span>{emoji}</span>
                                <span className="text-slate-500 font-medium">{users.length}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Seen status for last outgoing message */}
                {isOwn && isLastOutgoing && seenState && (
                    <div className="flex justify-end mt-0.5 mr-1">
                        <SeenStatus status={seenState} seenByAvatar={seenByInitial} className="text-xs" />
                    </div>
                )}
            </div>

            {/* Hover action toolbar */}
            {showActions && (
                <div className={`absolute ${isOwn ? "left-auto right-[calc(70%+16px)]" : "left-auto right-4"} top-0 flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-100 z-10`}>
                    <div className="relative">
                        <button
                            onClick={() => setShowReactionPicker(!showReactionPicker)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                            title="React"
                        >
                            <span className="text-sm">😀</span>
                        </button>
                        {showReactionPicker && (
                            <ReactionPicker
                                onSelect={(emoji) => { onReact?.(message.id, emoji); setShowReactionPicker(false); }}
                                onClose={() => setShowReactionPicker(false)}
                            />
                        )}
                    </div>
                    <button
                        onClick={() => onReply?.(message)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                        title="Reply"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10l7-7m0 0v14m0-14h11a2 2 0 012 2v6a2 2 0 01-2 2H10" /></svg>
                    </button>
                    {isOwn && (
                        <>
                            <button
                                onClick={() => onEdit?.(message)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                                title="Edit"
                            >
                                <Icons.Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => { if (confirm("Delete this message?")) onDelete?.(message.id); }}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-slate-400 hover:text-red-500"
                                title="Delete"
                            >
                                <Icons.Trash className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
