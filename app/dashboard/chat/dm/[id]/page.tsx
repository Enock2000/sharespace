"use client";

import { ChatWindow } from "@/components/chat/chat-window";

export default function DMPage({ params }: { params: { id: string } }) {
    return <ChatWindow channelId={params.id} type="dm" />;
}
