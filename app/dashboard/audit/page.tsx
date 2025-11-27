"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AuditLog } from "@/types/database";

export default function AuditPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/audit/logs?userId=${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [user]);

    const handleExport = () => {
        // Simple CSV export
        const headers = ["Timestamp", "Actor", "Action", "Resource Type", "Resource ID"];
        const csvContent = [
            headers.join(","),
            ...logs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.actor_id,
                log.action,
                log.resource_type,
                log.resource_id
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Audit Logs
                </h1>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                    <span>📥</span>
                    Export CSV
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="p-4 font-medium">Timestamp</th>
                            <th className="p-4 font-medium">Action</th>
                            <th className="p-4 font-medium">Actor</th>
                            <th className="p-4 font-medium">Resource</th>
                            <th className="p-4 font-medium">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">No logs found</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="p-4 text-slate-500">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium text-slate-900 dark:text-white capitalize">
                                            {log.action.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs text-slate-500">
                                        {log.actor_id.substring(0, 8)}...
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs">
                                            {log.resource_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 truncate max-w-xs">
                                        {JSON.stringify(log.metadata || {})}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
