"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { UploadRecord } from "@/types/database";

type FilterStatus = "all" | "pending" | "uploading" | "paused" | "failed" | "complete";

export default function UploadsPage() {
    const { user } = useAuth();
    const [uploads, setUploads] = useState<UploadRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>("all");

    const fetchUploads = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ userId: user.uid });
            if (filter !== "all") params.append("status", filter);

            const res = await fetch(`/api/uploads?${params.toString()}`);
            const data = await res.json();
            setUploads(data.uploads || []);
        } catch (error) {
            console.error("Failed to fetch uploads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUploads();
    }, [user, filter]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString();
    };

    const handleRetry = async (upload: UploadRecord) => {
        if (!user) return;
        try {
            await fetch(`/api/uploads/${upload.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    status: "pending",
                    progress: 0,
                    errorMessage: null
                })
            });
            fetchUploads();
        } catch (error) {
            console.error("Failed to retry upload:", error);
        }
    };

    const handlePause = async (upload: UploadRecord) => {
        if (!user) return;
        try {
            await fetch(`/api/uploads/${upload.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    status: "paused"
                })
            });
            fetchUploads();
        } catch (error) {
            console.error("Failed to pause upload:", error);
        }
    };

    const handleDelete = async (upload: UploadRecord) => {
        if (!user || !confirm("Delete this upload record?")) return;
        try {
            await fetch(`/api/uploads/${upload.id}?userId=${user.uid}`, {
                method: "DELETE"
            });
            fetchUploads();
        } catch (error) {
            console.error("Failed to delete upload:", error);
        }
    };

    const handleClearAll = async () => {
        if (!user || !confirm("Clear all completed and failed uploads?")) return;
        try {
            await fetch(`/api/uploads?userId=${user.uid}`, {
                method: "DELETE"
            });
            fetchUploads();
        } catch (error) {
            console.error("Failed to clear uploads:", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "complete": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "failed": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "uploading": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "paused": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            default: return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "complete": return <Icons.CheckCircle className="w-4 h-4" />;
            case "failed": return <Icons.AlertTriangle className="w-4 h-4" />;
            case "uploading": return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />;
            case "paused": return <Icons.Clock className="w-4 h-4" />;
            default: return <Icons.Clock className="w-4 h-4" />;
        }
    };

    const stats = {
        total: uploads.length,
        pending: uploads.filter(u => u.status === "pending").length,
        uploading: uploads.filter(u => u.status === "uploading").length,
        failed: uploads.filter(u => u.status === "failed").length,
        complete: uploads.filter(u => u.status === "complete").length,
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Icons.UploadCloud className="w-8 h-8 text-indigo-500" />
                        Upload History
                    </h1>
                    <p className="text-slate-500 mt-1">Track and manage your file uploads</p>
                </div>
                <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    Clear Completed & Failed
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Total", value: stats.total, color: "bg-slate-500" },
                    { label: "Pending", value: stats.pending, color: "bg-slate-400" },
                    { label: "Uploading", value: stats.uploading, color: "bg-blue-500" },
                    { label: "Failed", value: stats.failed, color: "bg-red-500" },
                    { label: "Complete", value: stats.complete, color: "bg-green-500" },
                ].map(stat => (
                    <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                            <span className="text-sm text-slate-500">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(["all", "pending", "uploading", "paused", "failed", "complete"] as FilterStatus[]).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === status
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Uploads List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500">Loading uploads...</p>
                    </div>
                ) : uploads.length === 0 ? (
                    <div className="p-12 text-center">
                        <Icons.UploadCloud className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500">No uploads found</p>
                        <p className="text-sm text-slate-400 mt-1">Your upload history will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {uploads.map(upload => (
                            <div key={upload.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icons.File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                            <span className="font-medium text-slate-900 dark:text-white truncate">
                                                {upload.file_name}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(upload.status)}`}>
                                                {getStatusIcon(upload.status)}
                                                {upload.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span>{formatBytes(upload.file_size)}</span>
                                            <span>{formatDate(upload.updated_at)}</span>
                                            {upload.retry_count > 0 && (
                                                <span className="text-orange-500">Retried {upload.retry_count}x</span>
                                            )}
                                        </div>
                                        {upload.error_message && (
                                            <p className="text-sm text-red-500 mt-1">{upload.error_message}</p>
                                        )}
                                    </div>

                                    {/* Progress Bar (for uploading) */}
                                    {upload.status === "uploading" && (
                                        <div className="w-32">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>{upload.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all"
                                                    style={{ width: `${upload.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {upload.status === "failed" && (
                                            <button
                                                onClick={() => handleRetry(upload)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Retry"
                                            >
                                                <Icons.RefreshCw className="w-4 h-4" />
                                            </button>
                                        )}
                                        {upload.status === "uploading" && (
                                            <button
                                                onClick={() => handlePause(upload)}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                                                title="Pause"
                                            >
                                                <Icons.Clock className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(upload)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
