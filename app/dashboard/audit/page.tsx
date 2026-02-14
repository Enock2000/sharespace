"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { AuditLog } from "@/types/database";

import { Icons } from "@/components/ui/icons";
import { TableRowSkeleton } from "@/components/ui/skeleton";

export default function AuditPage() {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionFilter, setActionFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchLogs = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                userId: user.uid,
                page: page.toString(),
                limit: "50"
            });

            if (actionFilter) params.append("action", actionFilter);
            if (dateFrom) params.append("dateFrom", dateFrom);
            if (dateTo) params.append("dateTo", dateTo);

            const res = await fetch(`/api/audit/logs?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [user, page, actionFilter, dateFrom, dateTo]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [actionFilter, dateFrom, dateTo]);

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Audit Logs
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchLogs()}
                        className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        title="Refresh"
                    >
                        <Icons.RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                        <span>📥</span>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Action Type</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="block w-48 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                        <option value="">All Actions</option>
                        <option value="user.login">Login</option>
                        <option value="file.upload">File Upload</option>
                        <option value="file.download">File Download</option>
                        <option value="file.delete">File Delete</option>
                        <option value="file.share">File Share</option>
                        <option value="folder.create">Folder Create</option>
                        <option value="team.create">Team Create</option>
                        <option value="settings.update">Settings Update</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date From</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Date To</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                </div>

                {(actionFilter || dateFrom || dateTo) && (
                    <button
                        onClick={() => {
                            setActionFilter("");
                            setDateFrom("");
                            setDateTo("");
                        }}
                        className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 hover:underline mb-[2px]"
                    >
                        Clear Filters
                    </button>
                )}
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
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRowSkeleton key={i} cells={5} />
                            ))
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
