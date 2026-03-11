"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, get, query, orderByChild, limitToLast } from "firebase/database";

interface AuditEntry {
    id: string;
    user_id: string;
    user_email?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details?: string;
    timestamp: number;
    ip_address?: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        async function fetchAuditLogs() {
            try {
                const db = getFirebaseDatabase();
                const logsRef = ref(db, "audit_logs");
                const logsQuery = query(logsRef, orderByChild("timestamp"), limitToLast(100));
                const snap = await get(logsQuery);

                if (snap.exists()) {
                    const entries = Object.entries(snap.val()).map(([id, val]: [string, any]) => ({
                        id,
                        ...val,
                    }));
                    setLogs(entries.sort((a, b) => b.timestamp - a.timestamp));
                } else {
                    // If no audit_logs collection exists, generate sample from user activity
                    const usersSnap = await get(ref(db, "users"));
                    const filesSnap = await get(ref(db, "files"));

                    const sampleLogs: AuditEntry[] = [];

                    if (usersSnap.exists()) {
                        Object.entries(usersSnap.val()).forEach(([id, u]: [string, any]) => {
                            sampleLogs.push({
                                id: `user-${id}`,
                                user_id: id,
                                user_email: u.email,
                                action: "user_registered",
                                resource_type: "user",
                                resource_id: id,
                                details: `User ${u.first_name || ""} ${u.last_name || ""} registered`,
                                timestamp: u.created_at || Date.now(),
                            });
                        });
                    }

                    if (filesSnap.exists()) {
                        Object.entries(filesSnap.val()).forEach(([id, f]: [string, any]) => {
                            sampleLogs.push({
                                id: `file-${id}`,
                                user_id: f.uploaded_by || "unknown",
                                action: "file_uploaded",
                                resource_type: "file",
                                resource_id: id,
                                details: `File "${f.name}" uploaded`,
                                timestamp: f.created_at || Date.now(),
                            });
                        });
                    }

                    setLogs(sampleLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100));
                }
            } catch (error) {
                console.error("Failed to fetch audit logs:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAuditLogs();
    }, []);

    const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.resource_type === filter);

    const getActionIcon = (action: string) => {
        if (action.includes("user")) return <Icons.User className="w-4 h-4" />;
        if (action.includes("file")) return <Icons.File className="w-4 h-4" />;
        if (action.includes("login")) return <Icons.Shield className="w-4 h-4" />;
        return <Icons.Activity className="w-4 h-4" />;
    };

    const getActionColor = (action: string) => {
        if (action.includes("delete")) return "text-red-600 bg-red-50 dark:bg-red-900/20";
        if (action.includes("create") || action.includes("register") || action.includes("upload")) return "text-green-600 bg-green-50 dark:bg-green-900/20";
        if (action.includes("update") || action.includes("edit")) return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
        return "text-slate-600 bg-slate-50 dark:bg-slate-700";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Track all platform activity and changes</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                        <option value="all">All Activity</option>
                        <option value="user">Users</option>
                        <option value="file">Files</option>
                        <option value="tenant">Tenants</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Icons.Scroll className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium">No audit logs found</p>
                        <p className="text-sm mt-1">Activity will appear here as users interact with the platform</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-lg mt-0.5 ${getActionColor(log.action)}`}>
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {log.details || log.action.replace(/_/g, " ")}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Icons.User className="w-3 h-3" />
                                                {log.user_email || log.user_id.slice(0, 12) + "..."}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                                {log.resource_type}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
