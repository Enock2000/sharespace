"use client";

import { useState, useRef, useEffect } from "react";

const EMOJI_CATEGORIES = [
    {
        name: "Smileys",
        icon: "😀",
        emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮"]
    },
    {
        name: "Gestures",
        icon: "👋",
        emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "🦾"]
    },
    {
        name: "Hearts",
        icon: "❤️",
        emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "🫶"]
    },
    {
        name: "Objects",
        icon: "🎉",
        emojis: ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🎮", "🎯", "🎵", "🎶", "🎤", "🎧", "📱", "💻", "📷", "📹", "💡", "🔔", "📌", "📎", "✏️", "📝", "📁", "📂", "🗂️", "📊", "📈"]
    },
    {
        name: "Nature",
        icon: "🌿",
        emojis: ["🌿", "🍀", "🌸", "🌺", "🌻", "🌹", "🌷", "🌱", "🌲", "🌳", "🍁", "🍂", "🍃", "🌍", "🌙", "⭐", "🌟", "✨", "⚡", "🔥", "🌈", "☀️", "⛅", "🌤️", "🌊", "❄️", "☃️", "💧", "🌬️"]
    },
    {
        name: "Food",
        icon: "🍕",
        emojis: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧁", "🎂", "🍰", "🍩", "🍪", "🍫", "🍬", "🍭", "☕", "🍵", "🥤", "🍺", "🍷", "🥂", "🍹", "🧃", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🥑"]
    }
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏"];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
    position?: "top" | "bottom";
}

export function EmojiPicker({ onSelect, onClose, position = "bottom" }: EmojiPickerProps) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [search, setSearch] = useState("");
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const filteredEmojis = search
        ? EMOJI_CATEGORIES.flatMap(c => c.emojis)
        : EMOJI_CATEGORIES[activeCategory].emojis;

    return (
        <div
            ref={pickerRef}
            className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} right-0 z-50 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}
        >
            {/* Search */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search emoji..."
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                />
            </div>

            {/* Category Tabs */}
            {!search && (
                <div className="flex border-b border-slate-100 dark:border-slate-700 px-1">
                    {EMOJI_CATEGORIES.map((cat, i) => (
                        <button
                            key={cat.name}
                            onClick={() => setActiveCategory(i)}
                            className={`flex-1 py-1.5 text-lg hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t transition-colors ${activeCategory === i ? "bg-slate-100 dark:bg-slate-700" : ""}`}
                            title={cat.name}
                        >
                            {cat.icon}
                        </button>
                    ))}
                </div>
            )}

            {/* Emoji Grid */}
            <div className="p-2 h-48 overflow-y-auto custom-scrollbar">
                {!search && (
                    <div className="text-[10px] uppercase font-semibold text-slate-400 px-1 mb-1">
                        {EMOJI_CATEGORIES[activeCategory].name}
                    </div>
                )}
                <div className="grid grid-cols-8 gap-0.5">
                    {filteredEmojis.map((emoji, i) => (
                        <button
                            key={`${emoji}-${i}`}
                            onClick={() => { onSelect(emoji); onClose(); }}
                            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors hover:scale-110"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full mb-1 left-0 z-50 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 px-1.5 py-1 flex gap-0.5 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
            {QUICK_REACTIONS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose(); }}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all hover:scale-125"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
}

export { QUICK_REACTIONS };
