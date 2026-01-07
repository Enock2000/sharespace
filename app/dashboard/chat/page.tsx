"use client";

import { Icons } from "@/components/ui/icons";

export default function ChatIndexPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-4">
                <Icons.MessageCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Select a conversation</h3>
            <p className="max-w-xs mx-auto text-sm">
                Choose a channel or direct message from the sidebar to start chatting.
            </p>
        </div>
    );
}
