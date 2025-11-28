"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import FileUploader from "@/components/ui/file-uploader";
import { File, Folder } from "@/types/database";

export default function FilesPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const fetchContents = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("userId", user.uid);
            if (currentFolderId) params.append("folderId", currentFolderId);

            const res = await fetch(`/api/files?${params.toString()}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setFiles(data.files || []);
            setFolders(data.folders || []);
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContents();
    }, [user, currentFolderId]);

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newFolderName.trim()) return;

        try {
            const res = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    parentId: currentFolderId,
                    userId: user.uid,
                }),
            });

            if (res.ok) {
                setNewFolderName("");
                setIsCreateFolderOpen(false);
                fetchContents();
            } else {
                const error = await res.json();
                console.error("Folder creation failed:", error);
                alert(error.error || "Failed to create folder");
            }
        } catch (error) {
            console.error("Failed to create folder:", error);
            alert("An error occurred while creating the folder");
        }
    };

    const handleDownload = (file: File) => {
        if (file.storage_key) {
            window.open(file.storage_key, "_blank");
        } else {
            alert("File URL not found");
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/files/${fileId}?userId=${user.uid}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchContents();
            } else {
                alert("Failed to delete file");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete file");
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/folders/${folderId}?userId=${user.uid}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchContents();
            } else {
                alert("Failed to delete folder");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete folder");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Files
                </h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        New Folder
                    </button>
                    <FileUploader
                        currentFolderId={currentFolderId}
                        onUploadComplete={fetchContents}
                    />
                </div>
            </div>

            {/* Breadcrumbs (Simplified) */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <button
                    onClick={() => setCurrentFolderId(null)}
                    className="hover:text-blue-500"
                >
                    Home
                </button>
                {currentFolderId && (
                    <>
                        <span>/</span>
                        <span>Current Folder</span>
                    </>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Folders */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all group relative"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📁</span>
                                <span className="font-medium truncate">{folder.name}</span>
                            </div>

                            {/* Folder Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete folder "${folder.name}"?`)) {
                                            handleDeleteFolder(folder.id);
                                        }
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg bg-white shadow-sm"
                                    title="Delete Folder"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Files */}
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all group relative"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">📄</span>
                                <span className="font-medium truncate flex-1">{file.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 flex justify-between">
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>

                            {/* File Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg bg-white shadow-sm"
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete file "${file.name}"?`)) {
                                            handleDeleteFile(file.id);
                                        }
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg bg-white shadow-sm"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}

                    {files.length === 0 && folders.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            This folder is empty
                        </div>
                    )}
                </div>
            )}

            {/* Create Folder Modal */}
            {isCreateFolderOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Create New Folder</h3>
                        <form onSubmit={handleCreateFolder}>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder Name"
                                className="w-full p-3 border rounded-lg mb-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateFolderOpen(false)}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newFolderName.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Folder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
