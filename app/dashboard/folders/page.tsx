"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState, useRef, useCallback } from "react";
import { Folder } from "@/types/database";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";

interface UploadProgress {
    fileName: string;
    loaded: number;
    total: number;
    percent: number;
    speed: number;
    timeRemaining: number;
    status: "uploading" | "saving" | "complete" | "error";
    errorMessage?: string;
}

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

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [totalFiles, setTotalFiles] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | null>(null);
    const [uploadMinimized, setUploadMinimized] = useState(false);

    const [error, setError] = useState("");

    // Format helpers
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds) || seconds < 0) return "Calculating...";
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const formatSpeed = (bytesPerSecond: number): string => {
        if (!isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "Calculating...";
        return formatBytes(bytesPerSecond) + "/s";
    };

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
        setUploadTargetFolderId(folderId);
        fileInputRef.current?.click();
    };

    // Direct upload to Backblaze B2
    const uploadFileDirectToB2 = useCallback((file: File, folderId: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Get upload URL from our API
                const urlResponse = await fetch("/api/files/b2-upload-url");
                if (!urlResponse.ok) {
                    throw new Error("Failed to get upload URL");
                }
                const { uploadUrl, authorizationToken } = await urlResponse.json();

                // 2. Upload directly to B2 using XHR for progress
                const xhr = new XMLHttpRequest();
                let startTime = Date.now();
                let lastLoaded = 0;
                let lastTime = startTime;

                xhr.upload.addEventListener("progress", (event) => {
                    if (event.lengthComputable) {
                        const currentTime = Date.now();
                        const timeDiff = (currentTime - lastTime) / 1000;
                        const loadedDiff = event.loaded - lastLoaded;

                        const instantSpeed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
                        const overallElapsed = (currentTime - startTime) / 1000;
                        const overallSpeed = overallElapsed > 0 ? event.loaded / overallElapsed : 0;
                        const speed = (instantSpeed + overallSpeed) / 2;

                        const remaining = event.total - event.loaded;
                        const timeRemaining = speed > 0 ? remaining / speed : 0;

                        setUploadProgress({
                            fileName: file.name,
                            loaded: event.loaded,
                            total: event.total,
                            percent: Math.round((event.loaded / event.total) * 100),
                            speed: speed,
                            timeRemaining: timeRemaining,
                            status: "uploading"
                        });

                        lastLoaded = event.loaded;
                        lastTime = currentTime;
                    }
                });

                xhr.addEventListener("load", async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            setUploadProgress(prev => prev ? { ...prev, status: "saving" } : null);

                            const b2Response = JSON.parse(xhr.responseText);

                            // 3. Save metadata to our database
                            const saveResponse = await fetch("/api/files/save-metadata", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: file.name,
                                    size: file.size,
                                    mime_type: file.type || "application/octet-stream",
                                    folderId: folderId,
                                    userId: user?.uid,
                                    fileId: b2Response.fileId,
                                    fileName: b2Response.fileName
                                }),
                            });

                            if (!saveResponse.ok) {
                                throw new Error("Failed to save file metadata");
                            }

                            setUploadProgress(prev => prev ? { ...prev, status: "complete" } : null);
                            resolve();
                        } catch (error: any) {
                            setUploadProgress(prev => prev ? { ...prev, status: "error", errorMessage: error.message } : null);
                            reject(error);
                        }
                    } else {
                        const errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;
                        setUploadProgress(prev => prev ? { ...prev, status: "error", errorMessage } : null);
                        reject(new Error(errorMessage));
                    }
                });

                xhr.addEventListener("error", () => {
                    setUploadProgress(prev => prev ? { ...prev, status: "error", errorMessage: "Network error during upload" } : null);
                    reject(new Error("Network error during upload"));
                });

                xhr.open("POST", uploadUrl);
                xhr.setRequestHeader("Authorization", authorizationToken);
                xhr.setRequestHeader("X-Bz-File-Name", encodeURIComponent(file.name));
                xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
                xhr.setRequestHeader("X-Bz-Content-Sha1", "do_not_verify");
                xhr.send(file);

                setUploadProgress({
                    fileName: file.name,
                    loaded: 0,
                    total: file.size,
                    percent: 0,
                    speed: 0,
                    timeRemaining: 0,
                    status: "uploading"
                });
            } catch (error: any) {
                setUploadProgress(prev => prev ? { ...prev, status: "error", errorMessage: error.message } : null);
                reject(error);
            }
        });
    }, [user]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !user || !uploadTargetFolderId) return;

        setUploading(true);
        setTotalFiles(files.length);
        setCurrentFileIndex(0);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
            setCurrentFileIndex(i + 1);
            try {
                await uploadFileDirectToB2(files[i], uploadTargetFolderId);
                successCount++;
            } catch (error) {
                console.error("Upload error:", error);
                failCount++;
            }
        }

        setUploading(false);
        setUploadProgress(null);
        setTotalFiles(0);
        setCurrentFileIndex(0);
        setUploadTargetFolderId(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (successCount > 0) {
            alert(`${successCount} file(s) uploaded successfully!`);
        }
        if (failCount > 0) {
            alert(`${failCount} file(s) failed to upload.`);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Hidden file input for uploads */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="*/*"
            />

            {/* Upload Progress Modal */}
            {uploading && uploadProgress && !uploadMinimized && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Icons.UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    Uploading File {currentFileIndex} of {totalFiles}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {uploadProgress.fileName}
                                </p>
                            </div>
                            <button
                                onClick={() => setUploadMinimized(true)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Hide to background"
                            >
                                <span className="text-xl font-bold text-slate-500">−</span>
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${uploadProgress.status === "error"
                                    ? "bg-red-500"
                                    : "bg-gradient-to-r from-blue-600 to-purple-600"
                                    }`}
                                style={{ width: `${uploadProgress.percent}%` }}
                            />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Progress</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Percentage</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {uploadProgress.percent}%
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Speed</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                    {formatSpeed(uploadProgress.speed)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Time Remaining</p>
                                <p className="font-semibold text-purple-600 dark:text-purple-400 text-sm">
                                    {formatTime(uploadProgress.timeRemaining)}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            {uploadProgress.status === "error" ? (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    <span className="text-red-600 dark:text-red-400">
                                        Error: {uploadProgress.errorMessage || "Upload failed"}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {uploadProgress.status === "uploading" && "Uploading to cloud storage..."}
                                        {uploadProgress.status === "saving" && "Saving file metadata..."}
                                        {uploadProgress.status === "complete" && "Complete!"}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Hide to Background Button */}
                        <button
                            onClick={() => setUploadMinimized(true)}
                            className="w-full mt-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
                        >
                            Hide to Background
                        </button>
                    </div>
                </div>
            )}

            {/* Minimized Upload Indicator */}
            {uploading && uploadProgress && uploadMinimized && (
                <div
                    onClick={() => setUploadMinimized(false)}
                    className="fixed bottom-6 right-6 z-[100] cursor-pointer animate-bounce"
                    style={{ animationDuration: "2s" }}
                >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform border-2 border-white/30">
                        <div className="relative">
                            <Icons.UploadCloud className="w-8 h-8" />
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-xs font-bold text-black">{currentFileIndex}</span>
                            </div>
                        </div>
                        <div className="text-sm">
                            <div className="font-bold text-base">Uploading {currentFileIndex} of {totalFiles}</div>
                            <div className="text-white/80 text-sm">{uploadProgress.percent}% • Click to View</div>
                        </div>
                        <div className="w-14 h-14 relative">
                            <svg className="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="none" />
                                <circle
                                    cx="28" cy="28" r="24"
                                    stroke="white" strokeWidth="5" fill="none"
                                    strokeDasharray={`${uploadProgress.percent * 1.508} 150.8`}
                                    className="transition-all duration-300"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{uploadProgress.percent}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Folders</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your folders and organize your files</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Icons.Plus className="w-5 h-5" />
                    New Folder
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
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Icons.Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <p className="text-blue-900 dark:text-blue-100 font-medium">Total Folders: {folders.length}</p>
                </div>
            )}

            {/* Folders Grid */}
            {!loading && folders.length === 0 && (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Icons.Folder className="w-16 h-16 mx-auto mb-4 text-slate-300" />
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
                                    className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 cursor-pointer"
                                    onClick={() => router.push(`/dashboard/files?folderId=${folder.id}`)}
                                >
                                    <Icons.Folder className="w-8 h-8" />
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                                        }}
                                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <Icons.MoreVertical className="w-5 h-5" />
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
                                                <Icons.Upload className="w-4 h-4" /> Upload Files
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    router.push(`/dashboard/files?folderId=${folder.id}`);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 flex items-center gap-2"
                                            >
                                                <Icons.Eye className="w-4 h-4" /> View Files
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
                                                <Icons.Edit className="w-4 h-4" /> Edit Name
                                            </button>
                                            <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    setActiveMenuId(null);
                                                    handleDeleteFolder(folder.id, folder.name);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <Icons.Trash className="w-4 h-4" /> Delete
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
