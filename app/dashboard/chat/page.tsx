"use client";

import { Icons } from "@/components/ui/icons";

export default function ChatIndexPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-5">
                <Icons.MessageCircle className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Your Messages
            </h3>
            <p className="max-w-xs mx-auto text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Send private messages to a friend or start a group chat. Your conversations will appear here.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    End-to-end encrypted
                </span>
                <span>•</span>
                <span>Fast & real-time</span>
                <span>•</span>
                <span>Media sharing</span>
            </div>
        </div>
    );
}
