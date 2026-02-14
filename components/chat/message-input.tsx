"use client";

import { useState, useRef } from "react";
import { Icons } from "@/components/ui/icons";

interface MessageInputProps {
    onSendMessage: (content: string, file?: File) => Promise<void>;
    disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!content.trim() && !file) || sending || disabled) return;

        setSending(true);
        try {
            await onSendMessage(content, file || undefined);
            setContent("");
            setFile(null);
        } catch (error) {
            console.error("Failed to send", error);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {file && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                    <Icons.File className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                        <Icons.X className="w-4 h-4" />
                    </button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                    <Icons.Plus className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />

                <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none p-3 max-h-32 min-h-[46px] resize-none focus:ring-0 text-sm"
                        rows={1}
                    />
                </div>

                <button
                    type="submit"
                    disabled={(!content.trim() && !file) || sending || disabled}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                >
                    {sending ? <Icons.Clock className="w-5 h-5 animate-spin" /> : <Icons.Check className="w-5 h-5 rotate-90" /> /* Use proper send icon if available, checking icons.tsx */}
                </button>
            </form>
        </div>
    );
}

// Note: I am assuming Icons.Send exists, but looking at icons.tsx, it might NOT.
// I will use Icons.Check rotated or something temporarily, or better yet, I'll add Send icon.
// I see Icons.Check in previous edits.
// I will check icons.tsx to see if Send exists.
