"use client";

export function TypingIndicator({ userName }: { userName?: string }) {
    return (
        <div className="flex items-center gap-2.5 px-4 py-2">
            <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.6s" }} />
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.6s" }} />
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.6s" }} />
            </div>
            {userName && (
                <span className="text-xs text-slate-400 italic">{userName} is typing...</span>
            )}
        </div>
    );
}
