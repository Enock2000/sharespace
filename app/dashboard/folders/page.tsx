"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState } from "react";
import { Folder } from "@/types/database";

export default function FoldersPage() {
    const { user } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const fetchFolders = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/files?userId=${user.uid}`);
            const data = await response.json();

            console.log("API Response:", data);

            if (data.folders) {
                setFolders(data.folders);
            }
        } catch (error) {
            console.error("Failed to fetch folders:", error);
            setError("Failed to load folders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, [user]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !user) return;

        setCreating(true);
        setError("");

        try {
            const response = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName,
                    parentId: null,
                    userId: user.uid,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create folder");
            }

            console.log("Folder created:", data);
            alert(`Folder "${newFolderName}" created successfully!`);

            setNewFolderName("");
            setShowCreateModal(false);

            // Refresh folder list
            await fetchFolders();
        } catch (error: any) {
            console.error("Create folder error:", error);
            setError(error.message || "Failed to create folder");
            alert("Error: " + (error.message || "Failed to create folder"));
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Folders
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Manage your folders and organize your files
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                    + New Folder
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading folders...</p>
                </div>
            )}

            {/* Folder Count */}
            {!loading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                        📁 Total Folders: {folders.length}
                    </p>
                </div>
            )}

            {/* Folders Grid */}
            {!loading && folders.length === 0 && (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        No folders yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Create your first folder to get started
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Create Folder
                    </button>
                </div>
            )}

            {!loading && folders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-4xl">📁</div>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                                    ⋮
                                </button>
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 truncate">
                                {folder.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Created {formatDate(folder.created_at)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Folder Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                            Create New Folder
                        </h2>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newFolderName.trim() && !creating) {
                                    handleCreateFolder();
                                }
                            }}
                            placeholder="Enter folder name..."
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewFolderName("");
                                    setError("");
                                }}
                                className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                disabled={creating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || creating}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                            >
                                {creating ? "Creating..." : "Create Folder"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
