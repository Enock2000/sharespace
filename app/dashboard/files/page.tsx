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
        if (!user || !newFolderName) return;

        try {
            const res = await fetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName,
                    parentId: currentFolderId,
                    userId: user.uid,
                }),
            });

            if (res.ok) {
                setNewFolderName("");
                setIsCreateFolderOpen(false);
                fetchContents();
            }
        } catch (error) {
            console.error("Failed to create folder:", error);
        }
    };

    const handleDownload = async (file: File) => {
        // In a real app, we'd get a signed URL from API
        // For MVP, we'll just alert or log
        console.log("Download", file.name);
        // TODO: Implement download API call
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
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📁</span>
                                <span className="font-medium truncate">{folder.name}</span>
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

                            {/* Hover Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                >
                                    ⬇️
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Create New Folder</h3>
                        <form onSubmit={handleCreateFolder}>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Folder Name"
                                className="w-full p-2 border rounded mb-4 dark:bg-slate-900 dark:border-slate-700"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateFolderOpen(false)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
