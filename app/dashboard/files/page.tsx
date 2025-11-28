"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import FileUploader from "@/components/ui/file-uploader";
import { File, Folder } from "@/types/database";
import { useSearchParams, useRouter } from "next/navigation";

type SortOption = "name_asc" | "name_desc" | "date_desc" | "date_asc" | "size_desc" | "size_asc";

export default function FilesPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialFolderId = searchParams.get("folderId");

    const [files, setFiles] = useState<File[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
    const [loading, setLoading] = useState(true);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Sorting State
    const [sortOption, setSortOption] = useState<SortOption>("date_desc");

    // File Viewer State
    const [viewingFile, setViewingFile] = useState<File | null>(null);

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

    // Sorting Logic
    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
            switch (sortOption) {
                case "name_asc": return a.name.localeCompare(b.name);
                case "name_desc": return b.name.localeCompare(a.name);
                case "date_desc": return b.created_at - a.created_at;
                case "date_asc": return a.created_at - b.created_at;
                case "size_desc": return b.size - a.size;
                case "size_asc": return a.size - b.size;
                default: return 0;
            }
        });
    }, [files, sortOption]);

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
        if (file.storage_key && file.storage_key.startsWith("http")) {
            window.open(file.storage_key, "_blank");
        } else {
            alert("File URL not found or legacy file.");
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!user || !confirm("Delete this file?")) return;
        try {
            const res = await fetch(`/api/files/${fileId}?userId=${user.uid}`, { method: "DELETE" });
            if (res.ok) fetchContents();
            else alert("Failed to delete file");
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete file");
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!user || !confirm("Delete this folder?")) return;
        try {
            const res = await fetch(`/api/folders/${folderId}?userId=${user.uid}`, { method: "DELETE" });
            if (res.ok) fetchContents();
            else alert("Failed to delete folder");
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete folder");
        }
    };

    // File Viewer Navigation
    const handleNextFile = () => {
        if (!viewingFile) return;
        const currentIndex = sortedFiles.findIndex(f => f.id === viewingFile.id);
        if (currentIndex < sortedFiles.length - 1) {
            setViewingFile(sortedFiles[currentIndex + 1]);
        }
    };

    const handlePrevFile = () => {
        if (!viewingFile) return;
        const currentIndex = sortedFiles.findIndex(f => f.id === viewingFile.id);
        if (currentIndex > 0) {
            setViewingFile(sortedFiles[currentIndex - 1]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!viewingFile) return;
        if (e.key === "ArrowRight") handleNextFile();
        if (e.key === "ArrowLeft") handlePrevFile();
        if (e.key === "Escape") setViewingFile(null);
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [viewingFile]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Files
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Sort Dropdown */}
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="date_desc">Date (Newest)</option>
                        <option value="date_asc">Date (Oldest)</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                        <option value="size_desc">Size (Largest)</option>
                        <option value="size_asc">Size (Smallest)</option>
                    </select>

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

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <button
                    onClick={() => {
                        setCurrentFolderId(null);
                        router.push("/dashboard/files");
                    }}
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
                            onClick={() => {
                                setCurrentFolderId(folder.id);
                                router.push(`/dashboard/files?folderId=${folder.id}`);
                            }}
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all group relative"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📁</span>
                                <span className="font-medium truncate">{folder.name}</span>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder.id);
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
                    {sortedFiles.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => setViewingFile(file)}
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all group relative"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">
                                    {file.mime_type.includes("image") ? "🖼️" : "📄"}
                                </span>
                                <span className="font-medium truncate flex-1">{file.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 flex justify-between">
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg bg-white shadow-sm"
                                    title="Download"
                                >
                                    ⬇️
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
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

            {/* File Viewer Modal */}
            {viewingFile && (
                <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col animate-in fade-in duration-200">
                    {/* Viewer Header */}
                    <div className="flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-md">
                        <div className="flex flex-col">
                            <h3 className="font-medium text-lg">{viewingFile.name}</h3>
                            <span className="text-sm text-white/60">
                                {(viewingFile.size / 1024 / 1024).toFixed(2)} MB • {new Date(viewingFile.created_at).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleDownload(viewingFile)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                title="Download"
                            >
                                ⬇️
                            </button>
                            <button
                                onClick={() => setViewingFile(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                title="Close (Esc)"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Viewer Content */}
                    <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">
                        {/* Navigation Buttons */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrevFile(); }}
                            className="absolute left-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-0"
                            disabled={sortedFiles.findIndex(f => f.id === viewingFile.id) === 0}
                        >
                            ◀
                        </button>

                        <div className="max-w-full max-h-full flex items-center justify-center">
                            {viewingFile.mime_type.startsWith("image/") ? (
                                <img
                                    src={viewingFile.storage_key}
                                    alt={viewingFile.name}
                                    className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-lg"
                                />
                            ) : viewingFile.mime_type === "application/pdf" ? (
                                <iframe
                                    src={viewingFile.storage_key}
                                    className="w-[80vw] h-[80vh] bg-white rounded-lg shadow-2xl"
                                />
                            ) : (
                                <div className="text-center text-white">
                                    <div className="text-6xl mb-4">📄</div>
                                    <p className="text-xl mb-4">Preview not available</p>
                                    <button
                                        onClick={() => handleDownload(viewingFile)}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                    >
                                        Download to View
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleNextFile(); }}
                            className="absolute right-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all disabled:opacity-0"
                            disabled={sortedFiles.findIndex(f => f.id === viewingFile.id) === sortedFiles.length - 1}
                        >
                            ▶
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
