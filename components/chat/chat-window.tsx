"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { db } from "@/lib/database/schema";
import { ChatChannel, ChatMessage, User, DMConversation } from "@/types/database";
import { MessageInput } from "./message-input";
import { onValue, ref, push, set, serverTimestamp, query, orderByChild, limitToLast } from "firebase/database";
import { getFirebaseDatabase } from "@/lib/firebase-config";

interface ChatWindowProps {
    channelId: string;
    type: "channel" | "dm";
}

export function ChatWindow({ channelId, type }: ChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [channelInfo, setChannelInfo] = useState<ChatChannel | null>(null);
    const [dmInfo, setDmInfo] = useState<DMConversation | null>(null);
    const [dmUser, setDmUser] = useState<User | null>(null);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

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

    // Real-time listener
    useEffect(() => {
        if (!channelId) return;

        setLoading(true);
        const rtdb = getFirebaseDatabase();
        const messagesRef = query(
            ref(rtdb, `chat_messages/${channelId}`),
            orderByChild("timestamp"),
            limitToLast(50)
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
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [channelId]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const handleSendMessage = async (content: string, file?: File) => {
        if (!user || !channelId) return;

        const rtdb = getFirebaseDatabase();
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: ChatMessage = {
            id: messageId,
            conversation_id: channelId,
            sender_id: user.uid,
            content,
            timestamp: Date.now(),
            type: "text"
        };

        await set(ref(rtdb, `chat_messages/${channelId}/${messageId}`), newMessage);
    };

    if (!channelId) return null;

    // Determine if external
    // Safe lookup: 
    const myTenant = user && dmInfo?.participants_tenants ? dmInfo.participants_tenants[user.uid] : null;
    const theirTenant = dmUser && dmInfo?.participants_tenants ? dmInfo.participants_tenants[dmUser.id] : null;
    const isExternalDm = type === 'dm' && myTenant && theirTenant && myTenant !== theirTenant;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'channel' ? "bg-slate-100 dark:bg-slate-700 text-slate-500" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"}`}>
                    {type === 'channel' ? <span className="text-lg font-bold">#</span> : <span className="text-lg font-bold">{dmUser?.first_name?.[0] || "?"}</span>}
                </div>
                <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">
                        {type === 'channel' ? (channelInfo?.name || "Loading...") : (dmUser ? `${dmUser.first_name} ${dmUser.last_name}` : "Loading...")}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                        {type === 'channel'
                            ? (channelInfo?.type === "public" ? "Public Channel" : "Private Channel")
                            : (
                                <>
                                    <span>{dmUser?.email}</span>
                                    {isExternalDm && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-bold">EXTERNAL</span>}
                                </>
                            )
                        }
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50"
            >
                {loading ? (
                    <div className="text-center py-10 opacity-50">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Icons.MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No messages yet. Be the first to say hello!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const sender = usersMap[msg.sender_id];
                        const showHeader = index === 0 || messages[index - 1].sender_id !== msg.sender_id || (msg.timestamp - messages[index - 1].timestamp > 600000);

                        return (
                            <div key={msg.id} className={`flex gap-3 ${showHeader ? "mt-6" : "mt-1"}`}>
                                {showHeader ? (
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                                        {sender?.first_name?.[0] || "?"}
                                    </div>
                                ) : (
                                    <div className="w-10 flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                    {showHeader && (
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                                {sender ? `${sender.first_name} ${sender.last_name}` : "Unknown User"}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <MessageInput onSendMessage={handleSendMessage} />
        </div>
    );
}
