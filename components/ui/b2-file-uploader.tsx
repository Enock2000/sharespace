"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";

interface UploadItem {
    id: string;
    file: File;
    loaded: number;
    total: number;
    percent: number;
    speed: number;
    timeRemaining: number;
    status: "queued" | "uploading" | "saving" | "complete" | "error";
    errorMessage?: string;
}

export default function B2FileUploader({
    currentFolderId,
    onUploadComplete
}: {
    currentFolderId: string | null,
    onUploadComplete: () => void
}) {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();
    const activeUploadsRef = useRef<Set<string>>(new Set());
    const MAX_CONCURRENT = 3; // Allow 3 concurrent uploads

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds) || seconds < 0) return "...";
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const formatSpeed = (bytesPerSecond: number): string => {
        if (!isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "...";
        return formatBytes(bytesPerSecond) + "/s";
    };

    // Process upload queue
    const processQueue = useCallback(() => {
        const activeCount = activeUploadsRef.current.size;
        if (activeCount >= MAX_CONCURRENT) return;

        const queued = uploads.filter(u => u.status === "queued");
        const slotsAvailable = MAX_CONCURRENT - activeCount;
        const toStart = queued.slice(0, slotsAvailable);

        toStart.forEach(item => {
            if (!activeUploadsRef.current.has(item.id)) {
                startUpload(item);
            }
        });
    }, [uploads]);

    useEffect(() => {
        processQueue();
    }, [uploads, processQueue]);

    const startUpload = async (item: UploadItem) => {
        activeUploadsRef.current.add(item.id);

        try {
            // Get upload URL
            const urlResponse = await fetch("/api/files/b2-upload-url");
            if (!urlResponse.ok) throw new Error("Failed to get upload URL");
            const { uploadUrl, authorizationToken } = await urlResponse.json();

            // Upload to B2
            await new Promise<void>((resolve, reject) => {
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

                        setUploads(prev => prev.map(u =>
                            u.id === item.id ? {
                                ...u,
                                loaded: event.loaded,
                                total: event.total,
                                percent: Math.round((event.loaded / event.total) * 100),
                                speed,
                                timeRemaining,
                                status: "uploading" as const
                            } : u
                        ));

                        lastLoaded = event.loaded;
                        lastTime = currentTime;
                    }
                });

                xhr.addEventListener("load", async () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            setUploads(prev => prev.map(u =>
                                u.id === item.id ? { ...u, status: "saving" as const } : u
                            ));

                            const b2Response = JSON.parse(xhr.responseText);

                            const saveResponse = await fetch("/api/files/save-metadata", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: item.file.name,
                                    size: item.file.size,
                                    mime_type: item.file.type || "application/octet-stream",
                                    folderId: currentFolderId,
                                    userId: user?.uid,
                                    fileId: b2Response.fileId,
                                    fileName: b2Response.fileName
                                }),
                            });

                            if (!saveResponse.ok) throw new Error("Failed to save metadata");

                            setUploads(prev => prev.map(u =>
                                u.id === item.id ? { ...u, status: "complete" as const, percent: 100 } : u
                            ));
                            resolve();
                        } catch (error: any) {
                            setUploads(prev => prev.map(u =>
                                u.id === item.id ? { ...u, status: "error" as const, errorMessage: error.message } : u
                            ));
                            reject(error);
                        }
                    } else {
                        setUploads(prev => prev.map(u =>
                            u.id === item.id ? { ...u, status: "error" as const, errorMessage: `HTTP ${xhr.status}` } : u
                        ));
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                });

                xhr.addEventListener("error", () => {
                    setUploads(prev => prev.map(u =>
                        u.id === item.id ? { ...u, status: "error" as const, errorMessage: "Network error" } : u
                    ));
                    reject(new Error("Network error"));
                });

                xhr.open("POST", uploadUrl);
                xhr.setRequestHeader("Authorization", authorizationToken);
                xhr.setRequestHeader("X-Bz-File-Name", encodeURIComponent(item.file.name));
                xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");
                xhr.setRequestHeader("X-Bz-Content-Sha1", "do_not_verify");

                setUploads(prev => prev.map(u =>
                    u.id === item.id ? { ...u, status: "uploading" as const } : u
                ));

                xhr.send(item.file);
            });
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            activeUploadsRef.current.delete(item.id);

            // Check if all done
            setTimeout(() => {
                const allDone = uploads.every(u => u.status === "complete" || u.status === "error");
                if (allDone && uploads.length > 0) {
                    onUploadComplete();
                }
            }, 100);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;

        const newUploads: UploadItem[] = Array.from(files).map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            loaded: 0,
            total: file.size,
            percent: 0,
            speed: 0,
            timeRemaining: 0,
            status: "queued" as const
        }));

        setUploads(prev => [...prev, ...newUploads]);
        setIsVisible(true);
        setIsMinimized(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const clearCompleted = () => {
        setUploads(prev => prev.filter(u => u.status !== "complete" && u.status !== "error"));
        if (uploads.filter(u => u.status !== "complete" && u.status !== "error").length === 0) {
            setIsVisible(false);
        }
    };

    const activeUploads = uploads.filter(u => u.status === "uploading" || u.status === "queued" || u.status === "saving");
    const completedUploads = uploads.filter(u => u.status === "complete");
    const errorUploads = uploads.filter(u => u.status === "error");
    const totalProgress = uploads.length > 0
        ? Math.round(uploads.reduce((acc, u) => acc + u.percent, 0) / uploads.length)
        : 0;

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                multiple
                accept="*/*"
            />

            {/* Upload Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
                <Icons.UploadCloud className="w-5 h-5" />
                <span>Upload Files</span>
            </button>

            {/* Minimized Floating Button - Click to View Uploads */}
            {isVisible && isMinimized && (
                <div
                    onClick={() => setIsMinimized(false)}
                    className="fixed bottom-6 right-6 z-[100] cursor-pointer animate-bounce"
                    style={{ animationDuration: "2s" }}
                >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform border-2 border-white/30">
                        <div className="relative">
                            <Icons.UploadCloud className="w-8 h-8" />
                            {activeUploads.length > 0 && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                    <span className="text-xs font-bold text-black">{activeUploads.length}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-sm">
                            <div className="font-bold text-base">{activeUploads.length > 0 ? `${activeUploads.length} Uploading` : "Uploads Complete"}</div>
                            <div className="text-white/80 text-sm">{totalProgress}% • Click to View</div>
                        </div>
                        <div className="w-14 h-14 relative">
                            <svg className="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.2)" strokeWidth="5" fill="none" />
                                <circle
                                    cx="28" cy="28" r="24"
                                    stroke="white" strokeWidth="5" fill="none"
                                    strokeDasharray={`${totalProgress * 1.508} 150.8`}
                                    className="transition-all duration-300"
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{totalProgress}%</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Upload Modal */}
            {isVisible && !isMinimized && (
                <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[70vh] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <div className="flex items-center gap-2">
                            <Icons.UploadCloud className="w-5 h-5" />
                            <span className="font-semibold">
                                {activeUploads.length > 0
                                    ? `Uploading ${activeUploads.length} file${activeUploads.length > 1 ? 's' : ''}`
                                    : `${completedUploads.length} completed`
                                }
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                title="Hide to background"
                            >
                                <span className="text-lg">−</span>
                            </button>
                            <button
                                onClick={() => { setIsVisible(false); clearCompleted(); }}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                title="Close"
                            >
                                <span className="text-lg">×</span>
                            </button>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    {activeUploads.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                                <span>Overall Progress</span>
                                <span>{totalProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${totalProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Upload List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {uploads.map(upload => (
                            <div
                                key={upload.id}
                                className={`p-3 rounded-lg border ${upload.status === "complete"
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : upload.status === "error"
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {upload.status === "complete" ? (
                                        <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : upload.status === "error" ? (
                                        <Icons.AlertTriangle className="w-4 h-4 text-red-600" />
                                    ) : upload.status === "uploading" || upload.status === "saving" ? (
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full bg-slate-300" />
                                    )}
                                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1">
                                        {upload.file.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {formatBytes(upload.file.size)}
                                    </span>
                                </div>

                                {(upload.status === "uploading" || upload.status === "saving") && (
                                    <>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                                style={{ width: `${upload.percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>{formatSpeed(upload.speed)}</span>
                                            <span>{upload.percent}%</span>
                                            <span>{formatTime(upload.timeRemaining)}</span>
                                        </div>
                                    </>
                                )}

                                {upload.status === "error" && (
                                    <p className="text-xs text-red-600">{upload.errorMessage}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    {(completedUploads.length > 0 || errorUploads.length > 0) && activeUploads.length === 0 && (
                        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={clearCompleted}
                                className="w-full py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )
            }
        </>
    );
}
