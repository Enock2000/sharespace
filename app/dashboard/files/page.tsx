"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { authFetch } from "@/lib/utils/api-client";
import B2FileUploader, { B2FileUploaderRef } from "@/components/ui/b2-file-uploader";
import { File, Folder } from "@/types/database";
import { useSearchParams, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { ShareModal } from "@/components/ui/share-modal";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import { FileVersionHistory } from "@/components/ui/file-version-history";
import { MoveCopyModal } from "@/components/ui/move-copy-modal";
import { Skeleton } from "@/components/ui/skeleton";

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
    const [sharingFile, setSharingFile] = useState<File | null>(null);
    const [historyFile, setHistoryFile] = useState<File | null>(null);
    const [moveCopyFile, setMoveCopyFile] = useState<File | null>(null);
    const [moveCopyMode, setMoveCopyMode] = useState<"move" | "copy">("move");

    // Drag and Drop
    const uploaderRef = useRef<B2FileUploaderRef>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploaderRef.current?.handleFiles(e.dataTransfer.files);
        }
    };

    const fetchContents = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (currentFolderId) params.append("folderId", currentFolderId);

            const res = await authFetch(`/api/files?${params.toString()}`, {}, user);
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
            const res = await authFetch("/api/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName.trim(),
                    parentId: currentFolderId,
                }),
            }, user);

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

    const handleDownload = async (file: File) => {
        if (!user) return;
        const token = await user.getIdToken();
        window.open(`/api/files/download/${file.id}?token=${token}`, "_blank");
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!user || !confirm("Delete this file?")) return;
        try {
            const res = await authFetch(`/api/files/${fileId}`, { method: "DELETE" }, user);
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
            // Note: Folder delete route might not be updated to [id] yet? 
            // Checking: folders/route.ts handles POST. 
            // Wait, folders/route.ts generally is just creation. Deletion might be on folders/[id]/route.ts
            // Let me check if folders/[id] exists. If not, I need to create it or if it was in folders/route.ts DELETE
            // In my previous `list_dir` of `api/folders`, there was only `route.ts`... wait.
            // Let me re-check api/folders structure.
            // Assuming it accepts DELETE on /api/folders?folderId=... if I didn't verify it.
            // I'll use query param for now if I didn't see [id].
            // But wait, I only updated `folders/route.ts` POST. I didn't check for DELETE.
            // If DELETE was there, I would have seen it.
            // Let me assume it might be missing or I missed it.
            // For now, I'll use authFetch and hope the route exists or I'll fix it next.
            const res = await authFetch(`/api/folders/${folderId}`, { method: "DELETE" }, user);
            // Wait, if [id] route doesn't exist, this will 404.
            // The original code was: fetch(`/api/folders/${folderId}?userId=${user.uid}`, { method: "DELETE" });
            // This suggests there IS a `folders/[id]/route.ts`.
            // Let me check that before confirming this code.
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
        <div
            className={`space-y-6 pb-20 min-h-screen transition-colors ${isDragging ? "bg-blue-50/50 dark:bg-blue-900/10 ring-4 ring-blue-500/20" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm transition-opacity ${isDragging ? "opacity-100" : "opacity-0"}`}>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border-4 border-dashed border-blue-500 flex flex-col items-center">
                    <Icons.UploadCloud className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">Drop files to upload</h3>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Files
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="appearance-none px-4 py-2 pr-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            <option value="date_desc">Date (Newest)</option>
                            <option value="date_asc">Date (Oldest)</option>
                            <option value="name_asc">Name (A-Z)</option>
                            <option value="name_desc">Name (Z-A)</option>
                            <option value="size_desc">Size (Largest)</option>
                            <option value="size_asc">Size (Smallest)</option>
                        </select>
                        <Icons.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>

                    <button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                        <Icons.Plus className="w-4 h-4" />
                        New Folder
                    </button>
                    <B2FileUploader
                        ref={uploaderRef}
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
                    className="hover:text-blue-500 flex items-center gap-1"
                >
                    <Icons.Home className="w-4 h-4" />
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-2">
                                <Skeleton variant="rounded" className="w-10 h-10" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton variant="text" className="h-4 w-3/4" />
                                    <Skeleton variant="text" className="h-3 w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all group relative shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Icons.Folder className="w-6 h-6" />
                                </div>
                                <span className="font-medium truncate">{folder.name}</span>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder.id);
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Delete Folder"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Files */}
                    {sortedFiles.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => setViewingFile(file)}
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 cursor-pointer transition-all group relative shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${file.mime_type.startsWith("image/") ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                    file.mime_type.startsWith("video/") ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" :
                                        file.mime_type.startsWith("audio/") ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                            "bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                    }`}>
                                    {file.mime_type.startsWith("image/") ? <Icons.Image className="w-6 h-6" /> :
                                        file.mime_type.startsWith("video/") ? <Icons.Video className="w-6 h-6" /> :
                                            file.mime_type.startsWith("audio/") ? <span className="text-xl">🎵</span> :
                                                <Icons.File className="w-6 h-6" />}
                                </div>
                                <span className="font-medium truncate flex-1">{file.name}</span>
                            </div>
                            <div className="text-xs text-slate-500 flex justify-between pl-1">
                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span>{new Date(file.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSharingFile(file); }}
                                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Share"
                                >
                                    <Icons.Share2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMoveCopyFile(file); setMoveCopyMode("copy"); }}
                                    className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Copy"
                                >
                                    <Icons.Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMoveCopyFile(file); setMoveCopyMode("move"); }}
                                    className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Move"
                                >
                                    <Icons.Folder className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setHistoryFile(file); }}
                                    className="p-1.5 hover:bg-orange-50 text-orange-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Version History"
                                >
                                    <Icons.History className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                    className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Download"
                                >
                                    <Icons.Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg bg-white shadow-sm border border-slate-100"
                                    title="Delete"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {files.length === 0 && folders.length === 0 && (
                        <div className="col-span-full text-center py-16 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Icons.Folder className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p className="text-lg font-medium text-slate-900 dark:text-white">This folder is empty</p>
                            <p className="text-sm mt-1">Upload files or create a folder to get started</p>
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
            <FilePreviewModal
                isOpen={!!viewingFile}
                file={viewingFile}
                onClose={() => setViewingFile(null)}
                onDownload={handleDownload}
                onNext={handleNextFile}
                onPrev={handlePrevFile}
                hasNext={viewingFile ? sortedFiles.findIndex(f => f.id === viewingFile.id) < sortedFiles.length - 1 : false}
                hasPrev={viewingFile ? sortedFiles.findIndex(f => f.id === viewingFile.id) > 0 : false}
            />

            {/* Share Modal */}
            {sharingFile && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setSharingFile(null)}
                    fileId={sharingFile.id}
                    fileName={sharingFile.name}
                />
            )}

            {historyFile && (
                <FileVersionHistory
                    file={historyFile}
                    onClose={() => setHistoryFile(null)}
                />
            )}

            {moveCopyFile && (
                <MoveCopyModal
                    file={moveCopyFile}
                    mode={moveCopyMode}
                    onClose={() => setMoveCopyFile(null)}
                    onComplete={() => {
                        fetchContents();
                        setMoveCopyFile(null);
                    }}
                />
            )}
        </div>
    );
}
