"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState, useRef } from "react";
import { Folder } from "@/types/database";
import { useRouter } from "next/navigation";
import { client, FILESTACK_OPTIONS } from "@/lib/filestack-config";
import { PickerFileMetadata } from "filestack-js";

export default function FoldersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Folder State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creating, setCreating] = useState(false);

    // Rename Folder State
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renaming, setRenaming] = useState(false);

    // Context Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [error, setError] = useState("");

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchFolders = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const response = await fetch(`/api/files?userId=${user.uid}`);
            const data = await response.json();
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
            if (!response.ok) throw new Error(data.error || "Failed to create folder");
            setNewFolderName("");
            setShowCreateModal(false);
            await fetchFolders();
        } catch (error: any) {
            setError(error.message || "Failed to create folder");
            alert("Error: " + (error.message || "Failed to create folder"));
        } finally {
            setCreating(false);
        }
    };

    const handleRenameFolder = async () => {
        if (!renameValue.trim() || !user || !folderToRename) return;
        setRenaming(true);
        try {
            const response = await fetch(`/api/folders/${folderToRename.id}?userId=${user.uid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: renameValue }),
            });
            if (!response.ok) throw new Error("Failed to rename folder");

            setShowRenameModal(false);
            setFolderToRename(null);
            setRenameValue("");
            await fetchFolders();
        } catch (error: any) {
            console.error("Rename error:", error);
            alert("Failed to rename folder");
        } finally {
            setRenaming(false);
        }
    };

    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        if (!user || !confirm(`Are you sure you want to delete "${folderName}"?`)) return;
        try {
            const res = await fetch(`/api/folders/${folderId}?userId=${user.uid}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchFolders();
            } else {
                alert("Failed to delete folder");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete folder");
        }
    };

    const handleUploadToFolder = (folderId: string) => {
        if (!user) return;
        const pickerOptions = {
            ...FILESTACK_OPTIONS,
            onUploadDone: async (res: any) => {
                try {
                    const filesUploaded = res.filesUploaded as PickerFileMetadata[];
                    for (const file of filesUploaded) {
                        await fetch("/api/files/upload", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                name: file.filename,
                                size: file.size,
                                mime_type: file.mimetype,
                                folderId: folderId,
                                userId: user.uid,
                                filestackUrl: file.url,
                                filestackHandle: file.handle,
                                source: "filestack"
                            }),
                        });
                    }
                    alert("Files uploaded successfully!");
                } catch (error) {
                    console.error("Upload error:", error);
                    alert("Upload failed to save metadata.");
                }
            },
        };
        client.picker(pickerOptions).open();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Folders</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your folders and organize your files</p>
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
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
                    <p className="text-blue-900 dark:text-blue-100 font-medium">📁 Total Folders: {folders.length}</p>
                </div>
            )}

            {/* Folders Grid */}
            {!loading && folders.length === 0 && (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No folders yet</h3>
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
                            className="relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-blue-400 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="text-4xl cursor-pointer"
                                    onClick={() => router.push(`/dashboard/files?folderId=${folder.id}`)}
                                >
                                    📁
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                                        }}
                                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <span className="text-xl font-bold">⋮</span>
                                    </button>

                                    {/* Context Menu */}
                                    {activeMenuId === folder.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 overflow-hidden animate-in fade-in zoom-in duration-200"
                                        >
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    handleUploadToFolder(folder.id);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-2"
                                            >
                                                <span>☁️</span> Upload Files
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    router.push(`/dashboard/files?folderId=${folder.id}`);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-2"
                                            >
                                                <span>👁️</span> View Files
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    setFolderToRename(folder);
                                                    setRenameValue(folder.name);
                                                    setShowRenameModal(true);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-2"
                                            >
                                                <span>✏️</span> Edit Name
                                            </button>
                                            <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    handleDeleteFolder(folder.id, folder.name);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <span>🗑️</span> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3
                                className="font-semibold text-slate-900 dark:text-white mb-2 truncate cursor-pointer hover:text-blue-600"
                                onClick={() => router.push(`/dashboard/files?folderId=${folder.id}`)}
                            >
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Folder</h2>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                            placeholder="Enter folder name..."
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim() || creating}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {creating ? "Creating..." : "Create Folder"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Folder Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Rename Folder</h2>
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
                            placeholder="Enter new folder name..."
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white mb-6"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRenameModal(false)}
                                className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenameFolder}
                                disabled={!renameValue.trim() || renaming}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {renaming ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
