"use client";

import { useState, useRef, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { EmojiPicker } from "./emoji-picker";
import { ChatMessage } from "@/types/database";

interface MessageInputProps {
    onSendMessage: (content: string, file?: File) => Promise<void>;
    onTyping?: () => void;
    disabled?: boolean;
    replyTo?: ChatMessage | null;
    onCancelReply?: () => void;
}

export function MessageInput({ onSendMessage, onTyping, disabled, replyTo, onCancelReply }: MessageInputProps) {
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [sending, setSending] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimer = useRef<NodeJS.Timeout | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 160) + "px";
        }
    }, [content]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!content.trim() && !file) || sending || disabled) return;

        setSending(true);
        try {
            await onSendMessage(content, file || undefined);
            setContent("");
            setFile(null);
            // Reset textarea height
            if (textareaRef.current) textareaRef.current.style.height = "auto";
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

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // Fire typing indicator (throttled)
        if (onTyping) {
            if (typingTimer.current) clearTimeout(typingTimer.current);
            onTyping();
            typingTimer.current = setTimeout(() => { }, 3000);
        }
    };

    const insertEmoji = (emoji: string) => {
        setContent(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    return (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* File Attachment Preview */}
            {file && (
                <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                    {file.type.startsWith("image/") ? (
                        <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <Icons.File className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[200px] text-slate-700 dark:text-slate-300">{file.name}</p>
                        <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-2 transition-colors">
                        <Icons.X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input Row */}
            <div className="p-3 flex gap-2 items-end">
                {/* Attachment Button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex-shrink-0"
                    title="Attach file"
                >
                    <Icons.Plus className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />

                {/* Text Input */}
                <div className="flex-1 relative bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-transparent border-none pl-4 pr-12 py-2.5 max-h-40 min-h-[42px] resize-none focus:ring-0 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
                        rows={1}
                    />

                    {/* Emoji Button (inside input) */}
                    <div className="absolute right-2 bottom-1.5">
                        <button
                            type="button"
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="p-1.5 text-slate-400 hover:text-yellow-500 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Emoji"
                        >
                            <span className="text-lg">😊</span>
                        </button>
                        {showEmoji && (
                            <EmojiPicker
                                onSelect={insertEmoji}
                                onClose={() => setShowEmoji(false)}
                                position="top"
                            />
                        )}
                    </div>
                </div>

                {/* Send Button */}
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={(!content.trim() && !file) || sending || disabled}
                    className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-30 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl transition-all flex-shrink-0 shadow-sm hover:shadow-md disabled:shadow-none"
                    title="Send message"
                >
                    {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Icons.Send className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
