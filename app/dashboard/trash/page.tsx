"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { DeletedItem } from "@/types/database";

interface TrashItemWithDays extends DeletedItem {
    days_remaining: number;
}

export default function TrashPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<TrashItemWithDays[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchTrash = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/trash?userId=${user.uid}`);
            const data = await res.json();
            setItems(data.items || []);
        } catch (error) {
            console.error("Failed to fetch trash:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, [user]);

    const handleRestore = async (item: TrashItemWithDays) => {
        if (!user) return;
        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/trash/${item.id}?userId=${user.uid}`, {
                method: "POST"
            });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== item.id));
            }
        } catch (error) {
            console.error("Failed to restore:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handlePermanentDelete = async (item: TrashItemWithDays) => {
        if (!confirm(`Permanently delete "${item.item_name}"? This cannot be undone.`)) return;
        if (!user) return;
        setActionLoading(item.id);
        try {
            const res = await fetch(`/api/trash?userId=${user.uid}&itemId=${item.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setItems(prev => prev.filter(i => i.id !== item.id));
            }
        } catch (error) {
            console.error("Failed to delete:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleEmptyTrash = async () => {
        if (!confirm("Permanently delete all items in trash? This cannot be undone.")) return;
        if (!user) return;
        setActionLoading("all");
        try {
            const res = await fetch(`/api/trash?userId=${user.uid}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setItems([]);
            }
        } catch (error) {
            console.error("Failed to empty trash:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "—";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getFileIcon = (item: TrashItemWithDays) => {
        if (item.item_type === "folder") return Icons.Folder;
        const mime = item.mime_type || "";
        if (mime.startsWith("image/")) return Icons.File;
        if (mime.startsWith("video/")) return Icons.File;
        if (mime.includes("pdf")) return Icons.File;
        return Icons.File;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Icons.Trash className="w-6 h-6 text-red-600" />
                        </div>
                        Trash
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Items in trash will be automatically deleted after 30 days
                    </p>
                </div>

                {items.length > 0 && (
                    <button
                        onClick={handleEmptyTrash}
                        disabled={actionLoading === "all"}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {actionLoading === "all" ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Icons.Trash className="w-4 h-4" />
                        )}
                        Empty Trash
                    </button>
                )}
            </div>

            {/* Empty State */}
            {items.length === 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Trash className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Trash is Empty
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        Deleted files and folders will appear here
                    </p>
                </div>
            )}

            {/* Trash Items List */}
            {items.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Size
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Deleted
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Days Left
                                </th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {items.map((item) => {
                                const IconComponent = getFileIcon(item);
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.item_type === "folder"
                                                        ? "bg-blue-100 dark:bg-blue-900/30"
                                                        : "bg-purple-100 dark:bg-purple-900/30"
                                                    }`}>
                                                    <IconComponent className={`w-5 h-5 ${item.item_type === "folder"
                                                            ? "text-blue-600"
                                                            : "text-purple-600"
                                                        }`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {item.item_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                                        {item.item_type}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {formatBytes(item.size || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(item.deleted_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.days_remaining <= 7
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                }`}>
                                                {item.days_remaining} days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(item)}
                                                    disabled={actionLoading === item.id}
                                                    className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors text-green-600"
                                                    title="Restore"
                                                >
                                                    {actionLoading === item.id ? (
                                                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Icons.RotateCcw className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(item)}
                                                    disabled={actionLoading === item.id}
                                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600"
                                                    title="Delete Permanently"
                                                >
                                                    <Icons.Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Storage Info */}
            {items.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Icons.AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Trash uses your storage quota
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Items in trash count toward your storage limit. Empty trash to free up space.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
