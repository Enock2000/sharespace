"use client";
import { SignatureAuditEntry } from "@/types/database";
import { Icons } from "@/components/ui/icons";

const actionIcons: Record<string, typeof Icons.Check> = {
    created: Icons.Plus,
    sent: Icons.Send,
    viewed: Icons.Eye,
    signed: Icons.Check,
    declined: Icons.X,
    cancelled: Icons.X,
    completed: Icons.CheckCircle,
    downloaded: Icons.Download,
};

const actionColors: Record<string, string> = {
    created: "bg-slate-500",
    sent: "bg-blue-500",
    viewed: "bg-purple-500",
    signed: "bg-green-500",
    declined: "bg-red-500",
    cancelled: "bg-red-500",
    completed: "bg-emerald-500",
    downloaded: "bg-indigo-500",
};

export default function AuditTrail({ entries }: { entries: SignatureAuditEntry[] }) {
    if (!entries.length) {
        return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No activity yet</p>;
    }

    return (
        <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-4">
                {entries.map((entry) => {
                    const IconComponent = actionIcons[entry.action] || Icons.Activity;
                    const dotColor = actionColors[entry.action] || "bg-slate-500";

                    return (
                        <div key={entry.id} className="relative flex items-start gap-4 pl-10">
                            <div className={`absolute left-2.5 w-3 h-3 rounded-full ${dotColor} ring-2 ring-white dark:ring-slate-900`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <IconComponent className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{entry.action.replace("_", " ")}</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {entry.actor_name}
                                    {entry.actor_email && <span className="text-slate-400 dark:text-slate-500"> ({entry.actor_email})</span>}
                                </p>
                                {entry.details && (
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{entry.details}</p>
                                )}
                                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                                    {new Date(entry.timestamp).toLocaleString()}
                                    {entry.ip_address && entry.ip_address !== "unknown" && (
                                        <span className="ml-2">IP: {entry.ip_address}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
