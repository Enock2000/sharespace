"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { ChatMessage, User, DMConversation } from "@/types/database";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { OnlineIndicator } from "./online-indicator";
import { ChatInfoPanel } from "./chat-info-panel";
import { useMessages } from "@/hooks/useMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useTyping, useUserPresence } from "@/hooks/usePresence";
import { db } from "@/lib/database/schema";
import { ref, update, remove, set, get, onValue } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ReactionPicker } from "./emoji-picker";

interface ChatWindowProps {
    channelId: string;
    type: "channel" | "dm";
}

export function ChatWindow({ channelId, type }: ChatWindowProps) {
    const { user } = useAuth();
    const { messages, usersMap, loading, markAsSeen } = useMessages(channelId);
    const { sendMessage, sending } = useSendMessage(channelId);
    const { typingUsers, setTyping } = useTyping(channelId);
    const [dmInfo, setDmInfo] = useState<DMConversation | null>(null);
    const [dmUser, setDmUser] = useState<User | null>(null);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [editContent, setEditContent] = useState("");
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottom = useRef(true);

    // Get other user's presence
    const otherUserId = dmUser?.id || null;
    const otherPresence = useUserPresence(otherUserId);

    // Fetch DM info
    useEffect(() => {
        if (!channelId || type !== "dm") return;
        const fetchDmInfo = async () => {
            const info = await db.get<DMConversation>(`dms/${channelId}`);
            setDmInfo(info);
            if (info && user) {
                const otherId = info.participants.find(p => p !== user.uid) || user.uid;
                const otherUser = await db.get<User>(`users/${otherId}`);
                setDmUser(otherUser);
            }
        };
        fetchDmInfo();
    }, [channelId, type, user]);

    // Mark messages as seen when viewing
    useEffect(() => {
        if (channelId && messages.length > 0) {
            markAsSeen();
        }
    }, [channelId, messages.length, markAsSeen]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (isAtBottom.current) scrollToBottom();
    }, [messages.length]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        isAtBottom.current = atBottom;
        setShowScrollBtn(!atBottom);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    };

    const handleSendMessage = async (content: string, file?: File) => {
        await sendMessage({
            content,
            type: file ? (file.type.startsWith("image/") ? "image" : "file") : "text",
            replyTo: replyTo ? { id: replyTo.id, content: replyTo.content.substring(0, 100), sender_id: replyTo.sender_id } : undefined,
        });
        setReplyTo(null);
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user || !channelId) return;
        const rtdb = getFirebaseDatabase();
        const reactionPath = `chat_messages/${channelId}/${messageId}/reactions/${emoji}`;
        const snap = await get(ref(rtdb, reactionPath));
        const currentUsers: string[] = snap.val() || [];

        if (currentUsers.includes(user.uid)) {
            const newUsers = currentUsers.filter(u => u !== user.uid);
            if (newUsers.length === 0) {
                await remove(ref(rtdb, reactionPath));
            } else {
                await set(ref(rtdb, reactionPath), newUsers);
            }
        } else {
            await set(ref(rtdb, reactionPath), [...currentUsers, user.uid]);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!channelId) return;
        const rtdb = getFirebaseDatabase();
        await update(ref(rtdb, `chat_messages/${channelId}/${messageId}`), {
            deletedForEveryone: true,
            content: "This message was deleted",
        });
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        if (!channelId || !newContent.trim()) return;
        const rtdb = getFirebaseDatabase();
        await update(ref(rtdb, `chat_messages/${channelId}/${messageId}`), {
            content: newContent,
            edited: true,
            edited_at: Date.now()
        });
        setEditingMsg(null);
        setEditContent("");
    };

    if (!channelId) return null;

    // Date separator helper
    const getDateLabel = (timestamp: number) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    };

    const shouldShowDate = (index: number) => {
        if (index === 0) return true;
        const prev = new Date(messages[index - 1].timestamp).toDateString();
        const curr = new Date(messages[index].timestamp).toDateString();
        return prev !== curr;
    };

    const shouldShowAvatar = (index: number) => {
        if (index === 0) return true;
        return messages[index].sender_id !== messages[index - 1].sender_id ||
            (messages[index].timestamp - messages[index - 1].timestamp > 600000);
    };

    const shouldShowTimestamp = (index: number) => {
        // Show timestamp on last message in a group or every 10 minutes
        if (index === messages.length - 1) return true;
        if (messages[index].sender_id !== messages[index + 1].sender_id) return true;
        return messages[index + 1].timestamp - messages[index].timestamp > 600000;
    };

    // Find last outgoing message index
    const lastOutgoingIdx = messages.reduce((last, msg, i) =>
        msg.sender_id === user?.uid ? i : last, -1);

    // Determine seen state for last outgoing message
    const getSeenState = (): "sent" | "delivered" | "seen" => {
        if (!dmUser || !dmInfo) return "sent";
        const lastReadAt = dmInfo.members_meta?.[dmUser.id]?.lastReadAt || 0;
        const lastMsg = messages[lastOutgoingIdx];
        if (!lastMsg) return "sent";
        if (lastReadAt >= lastMsg.timestamp) return "seen";
        return "delivered";
    };

    return (
        <div className="flex h-full">
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
                    {/* Back button for mobile */}
                    <button
                        onClick={() => window.history.back()}
                        className="lg:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Avatar */}
                    <div
                        className="relative cursor-pointer"
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                            {dmUser?.first_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        {otherPresence && (
                            <span className="absolute bottom-0 right-0">
                                <OnlineIndicator
                                    isOnline={otherPresence.isOnline}
                                    lastSeen={otherPresence.lastSeen}
                                    size="sm"
                                />
                            </span>
                        )}
                    </div>

                    <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                    >
                        <h2 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {dmUser ? `${dmUser.first_name} ${dmUser.last_name}` : "Loading..."}
                        </h2>
                        <p className="text-xs">
                            {otherPresence ? (
                                <OnlineIndicator
                                    isOnline={otherPresence.isOnline}
                                    lastSeen={otherPresence.lastSeen}
                                    showText
                                />
                            ) : (
                                <span className="text-slate-400">{dmUser?.email}</span>
                            )}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-indigo-600" title="Voice call">
                            <Icons.Phone className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-indigo-600" title="Video call">
                            <Icons.Video className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowInfoPanel(!showInfoPanel)}
                            className={`p-2 rounded-full transition-colors ${showInfoPanel ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"}`}
                            title="Chat info"
                        >
                            <Icons.MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto py-4 custom-scrollbar bg-white dark:bg-slate-900"
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                <p className="text-sm text-slate-400">Loading messages...</p>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center px-8">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                                    {dmUser?.first_name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">
                                    {dmUser ? `${dmUser.first_name} ${dmUser.last_name}` : "New Chat"}
                                </h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    This is the beginning of your conversation
                                </p>
                                <span className="text-xl">👋</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, index) => {
                                const sender = usersMap[msg.sender_id];
                                const isOwnMessage = msg.sender_id === user?.uid;
                                const showDate = shouldShowDate(index);
                                const showAvatar = shouldShowAvatar(index);
                                const showTimestamp = shouldShowTimestamp(index);
                                const isLast = index === lastOutgoingIdx;

                                return (
                                    <div key={msg.id}>
                                        {/* Date Separator */}
                                        {showDate && (
                                            <div className="flex justify-center py-4">
                                                <span className="text-[11px] font-medium text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full">
                                                    {getDateLabel(msg.timestamp)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Edit mode */}
                                        {editingMsg?.id === msg.id ? (
                                            <div className="px-4 py-2 mx-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <p className="text-xs text-indigo-600 font-medium mb-1">Editing message</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleEditMessage(msg.id, editContent);
                                                            if (e.key === "Escape") { setEditingMsg(null); setEditContent(""); }
                                                        }}
                                                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleEditMessage(msg.id, editContent)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">Save</button>
                                                    <button onClick={() => { setEditingMsg(null); setEditContent(""); }} className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-300 transition-colors">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <MessageBubble
                                                message={msg}
                                                isOwn={isOwnMessage}
                                                showAvatar={showAvatar}
                                                showTimestamp={showTimestamp}
                                                senderName={sender ? `${sender.first_name} ${sender.last_name}` : "Unknown"}
                                                senderInitial={sender?.first_name?.[0]?.toUpperCase() || "?"}
                                                isLastOutgoing={isLast && isOwnMessage}
                                                seenState={isLast && isOwnMessage ? getSeenState() : undefined}
                                                seenByInitial={dmUser?.first_name?.[0]?.toUpperCase()}
                                                onReply={(m) => setReplyTo(m)}
                                                onReact={handleReaction}
                                                onDelete={handleDeleteMessage}
                                                onEdit={(m) => { setEditingMsg(m); setEditContent(m.content); }}
                                                usersMap={usersMap}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {typingUsers.length > 0 && (
                                <TypingIndicator
                                    userName={typingUsers.length === 1
                                        ? usersMap[typingUsers[0]]?.first_name
                                        : `${typingUsers.length} people`}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Scroll to Bottom FAB */}
                {showScrollBtn && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-24 right-6 w-10 h-10 bg-white dark:bg-slate-700 shadow-lg rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 transition-all hover:scale-110 z-10"
                    >
                        <Icons.ChevronDown className="w-5 h-5" />
                    </button>
                )}

                {/* Reply Preview */}
                {replyTo && (
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
                        <div className="w-1 h-8 bg-indigo-500 rounded-full" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                Replying to {usersMap[replyTo.sender_id]?.first_name || "User"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{replyTo.content}</p>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600 p-1">
                            <Icons.X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Message Input */}
                <MessageInput
                    onSendMessage={handleSendMessage}
                    onTyping={setTyping}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                />
            </div>

            {/* Info Panel */}
            <ChatInfoPanel
                isOpen={showInfoPanel}
                onClose={() => setShowInfoPanel(false)}
                otherUser={dmUser}
                presence={otherPresence}
                isMuted={dmInfo?.members_meta?.[user?.uid || ""]?.isMuted}
            />
        </div>
    );
}
