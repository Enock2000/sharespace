"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { db } from "@/lib/database/schema";
import { ChatChannel, ChatMessage, User, DMConversation } from "@/types/database";
import { MessageInput } from "./message-input";
import { ReactionPicker } from "./emoji-picker";
import { onValue, ref, push, set, update, serverTimestamp, query, orderByChild, limitToLast, remove } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

interface ChatWindowProps {
    channelId: string;
    type: "channel" | "dm";
}

interface MessageReaction {
    emoji: string;
    users: string[];
}

export function ChatWindow({ channelId, type }: ChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [channelInfo, setChannelInfo] = useState<ChatChannel | null>(null);
    const [dmInfo, setDmInfo] = useState<DMConversation | null>(null);
    const [dmUser, setDmUser] = useState<User | null>(null);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
    const [editContent, setEditContent] = useState("");
    const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
    const [reactionPickerMsg, setReactionPickerMsg] = useState<string | null>(null);
    const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const isAtBottom = useRef(true);

    useEffect(() => {
        if (!channelId) return;
        if (type === "channel") {
            fetchChannelInfo();
        } else {
            fetchDmInfo();
        }
    }, [channelId, type]);

    const fetchChannelInfo = async () => {
        const info = await db.get<ChatChannel>(`chat_channels/${channelId}`);
        setChannelInfo(info);
    };

    const fetchDmInfo = async () => {
        const info = await db.get<DMConversation>(`dms/${channelId}`);
        setDmInfo(info);
        if (info && user) {
            const otherUserId = info.participants.find(p => p !== user.uid) || user.uid;
            const otherUser = await db.get<User>(`users/${otherUserId}`);
            setDmUser(otherUser);
        }
    };

    // Real-time message listener
    useEffect(() => {
        if (!channelId) return;
        setLoading(true);
        const rtdb = getFirebaseDatabase();
        const messagesRef = query(
            ref(rtdb, `chat_messages/${channelId}`),
            orderByChild("timestamp"),
            limitToLast(100)
        );

        const unsubscribe = onValue(messagesRef, async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const msgs = Object.values(data) as ChatMessage[];
                setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));

                const senderIds = new Set(msgs.map(m => m.sender_id));
                const newUsers: Record<string, User> = { ...usersMap };
                for (const uid of senderIds) {
                    if (!newUsers[uid]) {
                        const u = await db.get<User>(`users/${uid}`);
                        if (u) newUsers[uid] = u;
                    }
                }
                setUsersMap(newUsers);
            } else {
                setMessages([]);
            }
            setLoading(false);
            if (isAtBottom.current) scrollToBottom();
        });

        return () => unsubscribe();
    }, [channelId]);

    // Real-time reactions listener
    useEffect(() => {
        if (!channelId) return;
        const rtdb = getFirebaseDatabase();
        const reactionsRef = ref(rtdb, `chat_reactions/${channelId}`);
        const unsub = onValue(reactionsRef, (snapshot) => {
            const data = snapshot.val();
            setReactions(data || {});
        });
        return () => unsub();
    }, [channelId]);

    // Typing indicator listener
    useEffect(() => {
        if (!channelId || !user) return;
        const rtdb = getFirebaseDatabase();
        const typingRef = ref(rtdb, `chat_typing/${channelId}`);
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
    }, [channelId, user]);

    // Set typing indicator
    const setTyping = useCallback(() => {
        if (!channelId || !user) return;
        const rtdb = getFirebaseDatabase();
        set(ref(rtdb, `chat_typing/${channelId}/${user.uid}`), Date.now());
    }, [channelId, user]);

    // Clear typing on unmount
    useEffect(() => {
        return () => {
            if (channelId && user) {
                const rtdb = getFirebaseDatabase();
                remove(ref(rtdb, `chat_typing/${channelId}/${user.uid}`));
            }
        };
    }, [channelId, user]);

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
        if (!user || !channelId) return;
        const rtdb = getFirebaseDatabase();
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: any = {
            id: messageId,
            conversation_id: channelId,
            sender_id: user.uid,
            content,
            timestamp: Date.now(),
            type: "text"
        };

        if (replyTo) {
            newMessage.reply_to = {
                id: replyTo.id,
                content: replyTo.content.substring(0, 100),
                sender_id: replyTo.sender_id
            };
            setReplyTo(null);
        }

        if (type === "channel") {
            const updates: any = {};
            updates[`chat_messages/${channelId}/${messageId}`] = newMessage;
            updates[`chat_channels/${channelId}/last_message_at`] = newMessage.timestamp;
            await update(ref(rtdb), updates).catch((err: any) => {
                console.error("Failed to update channel", err);
                set(ref(rtdb, `chat_messages/${channelId}/${messageId}`), newMessage);
            });
        } else {
            const updates: any = {};
            updates[`chat_messages/${channelId}/${messageId}`] = newMessage;
            updates[`dms/${channelId}/last_message`] = {
                content: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
                sender_id: user.uid,
                timestamp: newMessage.timestamp
            };
            updates[`dms/${channelId}/updated_at`] = newMessage.timestamp;
            await update(ref(rtdb), updates).catch((err: any) => {
                console.error("Failed to update DM", err);
                set(ref(rtdb, `chat_messages/${channelId}/${messageId}`), newMessage);
            });
        }

        // Clear typing indicator
        remove(ref(rtdb, `chat_typing/${channelId}/${user.uid}`));
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user || !channelId) return;
        const rtdb = getFirebaseDatabase();
        const reactionPath = `chat_reactions/${channelId}/${messageId}/${emoji}`;
        const currentUsers = reactions[messageId]?.[emoji] || [];

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
        setReactionPickerMsg(null);
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!channelId) return;
        const rtdb = getFirebaseDatabase();
        await remove(ref(rtdb, `chat_messages/${channelId}/${messageId}`));
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

    // Update read status
    useEffect(() => {
        if (channelId) {
            localStorage.setItem(`last_read_${channelId}`, Date.now().toString());
        }
    }, [channelId, messages]);

    if (!channelId) return null;

    const myTenant = user && dmInfo?.participants_tenants ? dmInfo.participants_tenants[user.uid] : null;
    const theirTenant = dmUser && dmInfo?.participants_tenants ? dmInfo.participants_tenants[dmUser.id] : null;
    const isExternalDm = type === 'dm' && myTenant && theirTenant && myTenant !== theirTenant;

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

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${type === 'channel'
                    ? "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-400"
                    : "bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-600 dark:text-emerald-400"
                    }`}>
                    {type === 'channel' ? <span className="text-lg">#</span> : <span className="text-lg">{dmUser?.first_name?.[0] || "?"}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-900 dark:text-white truncate">
                        {type === 'channel' ? (channelInfo?.name || "Loading...") : (dmUser ? `${dmUser.first_name} ${dmUser.last_name}` : "Loading...")}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                        {type === 'channel'
                            ? (<>
                                <span className="flex items-center gap-1">
                                    {channelInfo?.type === "public" ? "📢" : "🔒"} {channelInfo?.type === "public" ? "Public" : "Private"}
                                </span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                <span>{messages.length} messages</span>
                            </>)
                            : (<>
                                <span>{dmUser?.email}</span>
                                {isExternalDm && <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold">EXTERNAL</span>}
                            </>)
                        }
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <Icons.Search className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <Icons.MoreVertical className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-1 custom-scrollbar bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/80 dark:to-slate-900"
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
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                                <Icons.MessageCircle className="w-10 h-10 text-indigo-400 opacity-50" />
                            </div>
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No messages yet</h3>
                            <p className="text-sm text-slate-400">Be the first to say hello! 👋</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const sender = usersMap[msg.sender_id];
                        const isOwnMessage = msg.sender_id === user?.uid;
                        const showHeader = index === 0 || messages[index - 1].sender_id !== msg.sender_id || (msg.timestamp - messages[index - 1].timestamp > 600000);
                        const showDate = shouldShowDate(index);
                        const msgReactions = reactions[msg.id] || {};
                        const replyInfo = (msg as any).reply_to;

                        return (
                            <div key={msg.id}>
                                {/* Date Separator */}
                                {showDate && (
                                    <div className="flex items-center gap-3 py-4">
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                        <span className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full">
                                            {getDateLabel(msg.timestamp)}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                    </div>
                                )}

                                {/* Message */}
                                <div
                                    className={`group relative flex gap-3 ${showHeader ? "mt-4" : "mt-0.5"} rounded-lg hover:bg-slate-50/80 dark:hover:bg-slate-800/30 px-2 py-0.5 -mx-2 transition-colors`}
                                    onMouseEnter={() => setHoveredMsg(msg.id)}
                                    onMouseLeave={() => { setHoveredMsg(null); if (reactionPickerMsg === msg.id) setReactionPickerMsg(null); }}
                                >
                                    {/* Avatar */}
                                    {showHeader ? (
                                        <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs ${isOwnMessage
                                            ? "bg-gradient-to-br from-indigo-400 to-purple-500 text-white"
                                            : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-600 dark:text-slate-300"
                                            }`}>
                                            {sender?.first_name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    ) : (
                                        <div className="w-9 flex-shrink-0" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {/* Header */}
                                        {showHeader && (
                                            <div className="flex items-baseline gap-2 mb-0.5">
                                                <span className={`font-semibold text-sm ${isOwnMessage ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                                                    {sender ? `${sender.first_name} ${sender.last_name}` : "Unknown User"}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {(msg as any).edited && (
                                                    <span className="text-[10px] text-slate-400 italic">(edited)</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Reply Quote */}
                                        {replyInfo && (
                                            <div className="mb-1 pl-3 border-l-2 border-indigo-300 dark:border-indigo-600">
                                                <p className="text-xs text-slate-400 truncate">
                                                    <span className="font-medium">{usersMap[replyInfo.sender_id]?.first_name || "User"}</span>: {replyInfo.content}
                                                </p>
                                            </div>
                                        )}

                                        {/* Content */}
                                        {editingMsg?.id === msg.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") handleEditMessage(msg.id, editContent);
                                                        if (e.key === "Escape") { setEditingMsg(null); setEditContent(""); }
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleEditMessage(msg.id, editContent)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Save</button>
                                                <button onClick={() => { setEditingMsg(null); setEditContent(""); }} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-300">Cancel</button>
                                            </div>
                                        ) : (
                                            <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                {msg.content}
                                            </p>
                                        )}

                                        {/* Reactions */}
                                        {Object.keys(msgReactions).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {Object.entries(msgReactions).map(([emoji, users]) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg.id, emoji)}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${(users as string[]).includes(user?.uid || "")
                                                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                            }`}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="font-medium">{(users as string[]).length}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Actions Toolbar */}
                                    {hoveredMsg === msg.id && !editingMsg && (
                                        <div className="absolute -top-3 right-2 flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-100">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setReactionPickerMsg(reactionPickerMsg === msg.id ? null : msg.id)}
                                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                                                    title="Add reaction"
                                                >
                                                    <span className="text-sm">😀</span>
                                                </button>
                                                {reactionPickerMsg === msg.id && (
                                                    <ReactionPicker
                                                        onSelect={(emoji) => handleReaction(msg.id, emoji)}
                                                        onClose={() => setReactionPickerMsg(null)}
                                                    />
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setReplyTo(msg)}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                                                title="Reply"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10l7-7m0 0v14m0-14h11a2 2 0 012 2v6a2 2 0 01-2 2H10" /></svg>
                                            </button>
                                            {isOwnMessage && (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingMsg(msg); setEditContent(msg.content); }}
                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
                                                        title="Edit"
                                                    >
                                                        <Icons.Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { if (confirm("Delete this message?")) handleDeleteMessage(msg.id); }}
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
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-2 text-sm text-slate-400">
                        <div className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs italic">
                            {typingUsers.length === 1
                                ? `${usersMap[typingUsers[0]]?.first_name || "Someone"} is typing...`
                                : `${typingUsers.length} people are typing...`}
                        </span>
                    </div>
                )}
            </div>

            {/* Scroll to Bottom FAB */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-6 w-10 h-10 bg-white dark:bg-slate-700 shadow-lg rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 transition-all hover:scale-110 animate-in fade-in slide-in-from-bottom-2 z-10"
                >
                    <Icons.ChevronDown className="w-5 h-5" />
                </button>
            )}

            {/* Reply Preview */}
            {replyTo && (
                <div className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                    <div className="w-1 h-8 bg-indigo-400 rounded-full" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            Replying to {usersMap[replyTo.sender_id]?.first_name || "User"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{replyTo.content}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600">
                        <Icons.X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input */}
            <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={setTyping}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
            />
        </div>
    );
}
