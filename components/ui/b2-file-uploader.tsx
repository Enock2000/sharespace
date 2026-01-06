"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
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

export default function B2FileUploader({
    currentFolderId,
    onUploadComplete
}: {
    currentFolderId: string | null,
    onUploadComplete: () => void
}) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [totalFiles, setTotalFiles] = useState(0);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

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

    // Direct upload to Backblaze B2 (bypasses Vercel limits)
    const uploadFileDirectToB2 = useCallback(async (file: File): Promise<void> => {
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

                        setProgress({
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
                            setProgress(prev => prev ? { ...prev, status: "saving" } : null);

                            const b2Response = JSON.parse(xhr.responseText);

                            // 3. Save metadata to our database
                            const saveResponse = await fetch("/api/files/save-metadata", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name: file.name,
                                    size: file.size,
                                    mime_type: file.type || "application/octet-stream",
                                    folderId: currentFolderId,
                                    userId: user?.uid,
                                    fileId: b2Response.fileId,
                                    fileName: b2Response.fileName
                                }),
                            });

                            if (!saveResponse.ok) {
                                throw new Error("Failed to save file metadata");
                            }

                            setProgress(prev => prev ? { ...prev, status: "complete" } : null);
                            resolve();
                        } catch (error: any) {
                            setProgress(prev => prev ? { ...prev, status: "error", errorMessage: error.message } : null);
                            reject(error);
                        }
                    } else {
                        const errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;
                        setProgress(prev => prev ? { ...prev, status: "error", errorMessage } : null);
                        reject(new Error(errorMessage));
                    }
                });

                xhr.addEventListener("error", () => {
                    setProgress(prev => prev ? { ...prev, status: "error", errorMessage: "Network error during upload" } : null);
                    reject(new Error("Network error during upload"));
                });

                xhr.open("POST", uploadUrl);
                xhr.setRequestHeader("Authorization", authorizationToken);
                xhr.setRequestHeader("X-Bz-File-Name", encodeURIComponent(file.name));
                xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
                xhr.setRequestHeader("X-Bz-Content-Sha1", "do_not_verify");
                xhr.send(file);

                setProgress({
                    fileName: file.name,
                    loaded: 0,
                    total: file.size,
                    percent: 0,
                    speed: 0,
                    timeRemaining: 0,
                    status: "uploading"
                });
            } catch (error: any) {
                setProgress(prev => prev ? { ...prev, status: "error", errorMessage: error.message } : null);
                reject(error);
            }
        });
    }, [user, currentFolderId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;

        setUploading(true);
        setTotalFiles(files.length);
        setCurrentFileIndex(0);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
            setCurrentFileIndex(i + 1);
            try {
                await uploadFileDirectToB2(files[i]);
                successCount++;
            } catch (error) {
                console.error("Upload failed:", error);
                failCount++;
            }
        }

        setUploading(false);
        setProgress(null);
        setTotalFiles(0);
        setCurrentFileIndex(0);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        if (successCount > 0) {
            onUploadComplete();
        }

        if (failCount > 0) {
            alert(`${failCount} file(s) failed to upload. ${successCount} succeeded.`);
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
                multiple
                accept="*/*"
            />

            {/* Upload Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
                {uploading ? (
                    <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Uploading {currentFileIndex}/{totalFiles}</span>
                    </>
                ) : (
                    <>
                        <Icons.UploadCloud className="w-5 h-5" />
                        <span>Upload Files</span>
                    </>
                )}
            </button>

            {/* Progress Modal */}
            {uploading && progress && (
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
                                    {progress.fileName}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${progress.status === "error"
                                        ? "bg-red-500"
                                        : "bg-gradient-to-r from-blue-600 to-purple-600"
                                    }`}
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Progress</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Percentage</p>
                                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                    {progress.percent}%
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Speed</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                                    {formatSpeed(progress.speed)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Time Remaining</p>
                                <p className="font-semibold text-purple-600 dark:text-purple-400 text-sm">
                                    {formatTime(progress.timeRemaining)}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center gap-2 text-sm">
                            {progress.status === "error" ? (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    <span className="text-red-600 dark:text-red-400">
                                        Error: {progress.errorMessage || "Upload failed"}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {progress.status === "uploading" && "Uploading to cloud storage..."}
                                        {progress.status === "saving" && "Saving file metadata..."}
                                        {progress.status === "complete" && "Complete!"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
