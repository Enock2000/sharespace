"use client";

interface OnlineIndicatorProps {
    isOnline: boolean;
    lastSeen?: number;
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}

function formatLastSeen(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Active now";
    if (mins < 60) return `Active ${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Active ${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Active ${days}d ago`;
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OnlineIndicator({ isOnline, lastSeen, size = "sm", showText = false }: OnlineIndicatorProps) {
    const dotSizes = {
        sm: "w-2.5 h-2.5",
        md: "w-3 h-3",
        lg: "w-3.5 h-3.5",
    };

    const borderSizes = {
        sm: "border-[1.5px]",
        md: "border-2",
        lg: "border-2",
    };

    if (showText) {
        return (
            <span className={`text-xs ${isOnline ? "text-emerald-500" : "text-slate-400"}`}>
                {isOnline ? "Active now" : lastSeen ? formatLastSeen(lastSeen) : "Offline"}
            </span>
        );
    }

    return (
        <span
            className={`inline-block ${dotSizes[size]} rounded-full ${borderSizes[size]} border-white dark:border-slate-800 ${
                isOnline
                    ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                    : "bg-slate-300 dark:bg-slate-600"
            }`}
            title={isOnline ? "Online" : lastSeen ? formatLastSeen(lastSeen) : "Offline"}
        />
    );
}

export { formatLastSeen };
