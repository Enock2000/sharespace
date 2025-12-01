"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { AdminAuditLog } from "@/types/admin";

export default function ActivityFeed() {
    const [logs, setLogs] = useState<AdminAuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentActivity();
    }, []);

    const fetchRecentActivity = async () => {
        try {
            const res = await fetch("/api/admin/audit?limit=5");
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes("create")) return <Icons.Plus className="w-4 h-4" />;
        if (action.includes("update")) return <Icons.Edit className="w-4 h-4" />;
        if (action.includes("delete")) return <Icons.Trash className="w-4 h-4" />;
        if (action.includes("suspend")) return <Icons.Ban className="w-4 h-4" />;
        if (action.includes("login")) return <Icons.LogIn className="w-4 h-4" />;
        return <Icons.Activity className="w-4 h-4" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes("create")) return "text-green-600";
        if (action.includes("update")) return "text-blue-600";
        if (action.includes("delete")) return "text-red-600";
        if (action.includes("suspend")) return "text-orange-600";
        return "text-slate-600";
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Icons.Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <div className={`mt-0.5 ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white font-medium truncate">
                            {log.admin_email}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {log.action.replace(/_/g, " ")} on {log.target_type}
                        </p>
                    </div>

                    <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatTime(log.timestamp)}
                    </span>
                </div>
            ))}
        </div>
    );
}
