"use client";
import { SignatureRequestStatus, SignerStatus } from "@/types/database";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    draft: { label: "Draft", bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-300" },
    pending: { label: "Pending", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
    in_progress: { label: "In Progress", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    completed: { label: "Completed", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    cancelled: { label: "Cancelled", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    declined: { label: "Declined", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    viewed: { label: "Viewed", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400" },
    signed: { label: "Signed", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
};

export default function StatusBadge({ status, size = "sm" }: { status: SignatureRequestStatus | SignerStatus; size?: "sm" | "md" }) {
    const config = statusConfig[status] || statusConfig.draft;
    const sizeClasses = size === "md" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.text.replace("text-", "bg-")}`} />
            {config.label}
        </span>
    );
}
