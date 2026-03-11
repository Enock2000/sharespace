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
    const imageInputRef = useRef<HTMLInputElement>(null);
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

    const hasContent = content.trim() || file;

    return (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {/* File Attachment Preview */}
            {file && (
                <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                    {file.type.startsWith("image/") ? (
                        <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                            <Icons.File className="w-5 h-5 text-indigo-500" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[200px] text-slate-700 dark:text-slate-300">{file.name}</p>
                        <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 ml-2 transition-colors p-1">
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
                    className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors flex-shrink-0"
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

                {/* Image button */}
                <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors flex-shrink-0"
                    title="Send image"
                >
                    <Icons.Image className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />

                {/* Text Input */}
                <div className="flex-1 relative bg-slate-100 dark:bg-slate-700/50 rounded-full focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-700 transition-all border border-transparent focus-within:border-indigo-200 dark:focus-within:border-indigo-800">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Aa"
                        className="w-full bg-transparent border-none pl-4 pr-12 py-2.5 max-h-40 min-h-[42px] resize-none focus:ring-0 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
                        rows={1}
                    />

                    {/* Emoji Button (inside input) */}
                    <div className="absolute right-2 bottom-1.5">
                        <button
                            type="button"
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="p-1.5 text-slate-400 hover:text-yellow-500 rounded-full transition-colors"
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

                {/* Send / Mic Button */}
                {hasContent ? (
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={sending || disabled}
                        className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-30 text-white rounded-full transition-all flex-shrink-0 shadow-md hover:shadow-lg disabled:shadow-none hover:scale-105"
                        title="Send message"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Icons.Send className="w-5 h-5" />
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="p-2.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors flex-shrink-0"
                        title="Voice message (coming soon)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
