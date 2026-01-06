"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";

interface UploadProgress {
    fileName: string;
    loaded: number;
    total: number;
    percent: number;
    speed: number; // bytes per second
    timeRemaining: number; // seconds
    status: "uploading" | "processing" | "complete" | "error";
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
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const formatSpeed = (bytesPerSecond: number): string => {
        return formatBytes(bytesPerSecond) + "/s";
    };

    const uploadFileWithProgress = useCallback(async (file: File): Promise<void> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("userId", user!.uid);
            formData.append("folderId", currentFolderId || "null");

            let startTime = Date.now();
            let lastLoaded = 0;
            let lastTime = startTime;

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastTime) / 1000; // seconds
                    const loadedDiff = event.loaded - lastLoaded;

                    // Calculate speed (use moving average for smoother display)
                    const instantSpeed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
                    const overallElapsed = (currentTime - startTime) / 1000;
                    const overallSpeed = overallElapsed > 0 ? event.loaded / overallElapsed : 0;
                    const speed = (instantSpeed + overallSpeed) / 2; // Average for smoother display

                    // Calculate time remaining
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

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setProgress(prev => prev ? { ...prev, status: "complete" } : null);
                    resolve();
                } else {
                    const errorMsg = xhr.responseText || "Upload failed";
                    setProgress(prev => prev ? { ...prev, status: "error" } : null);
                    reject(new Error(errorMsg));
                }
            });

            xhr.addEventListener("error", () => {
                setProgress(prev => prev ? { ...prev, status: "error" } : null);
                reject(new Error("Network error during upload"));
            });

            xhr.open("POST", "/api/files/upload-file");
            xhr.send(formData);

            setProgress({
                fileName: file.name,
                loaded: 0,
                total: file.size,
                percent: 0,
                speed: 0,
                timeRemaining: 0,
                status: "uploading"
            });
        });
    }, [user, currentFolderId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;

        setUploading(true);
        setTotalFiles(files.length);
        setCurrentFileIndex(0);

        try {
            for (let i = 0; i < files.length; i++) {
                setCurrentFileIndex(i + 1);
                await uploadFileWithProgress(files[i]);
            }
            onUploadComplete();
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setProgress(null);
            setTotalFiles(0);
            setCurrentFileIndex(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
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
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    Uploading File {currentFileIndex} of {totalFiles}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                    {progress.fileName}
                                </p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Progress</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Percentage</p>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                    {progress.percent}%
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Speed</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400">
                                    {formatSpeed(progress.speed)}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Time Remaining</p>
                                <p className="font-semibold text-purple-600 dark:text-purple-400">
                                    {progress.timeRemaining > 0 ? formatTime(progress.timeRemaining) : "Calculating..."}
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span>
                                {progress.status === "uploading" && "Uploading to cloud storage..."}
                                {progress.status === "processing" && "Processing file..."}
                                {progress.status === "complete" && "Complete!"}
                                {progress.status === "error" && "Error occurred"}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
