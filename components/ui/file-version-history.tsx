"use client";

import { useState, useEffect } from "react";
import { File, FileVersion } from "@/types/database";
import { useAuth } from "@/lib/auth/auth-context";
import { authFetch } from "@/lib/utils/api-client";
import { Icons } from "@/components/ui/icons";

interface FileVersionHistoryProps {
    file: File;
    onClose: () => void;
}

export function FileVersionHistory({ file, onClose }: FileVersionHistoryProps) {
    const { user } = useAuth();
    const [versions, setVersions] = useState<FileVersion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            if (!user) return;
            try {
                const res = await authFetch(`/api/files/${file.id}/versions`, {}, user);
                const data = await res.json();
                if (data.versions) {
                    setVersions(data.versions);
                }
            } catch (error) {
                console.error("Failed to fetch versions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVersions();
    }, [file.id, user]);

    const handleDownloadVersion = async (version: FileVersion) => {
        if (!user) return;
        const token = await user.getIdToken();
        // We probably need a specific version download route or query param
        // Current download route downloads the current file (which is latest).
        // To download a specific version, backend needs to support it. 
        // B2 file name might be different if we stored it differently, but typically it is same name overridden?
        // Wait, B2 handles versions. Using fileId (storage_key) is enough if it points to specific version ID?
        // In our `file-service.ts`, `storage_key` is the B2 file ID.
        // So `api/files/download/[fileId]` uses `file.storage_key` or lookup by ID?
        // `api/files/download/[fileId]` looks up `files/[fileId]` which has `b2_file_name`.
        // It calls `backblazeService.getDownloadUrl(fileName)`.
        // Backblaze `getDownloadUrl` usually gets the latest version of that name.
        // To get a specific version from B2, we need `fileId` (B2 ID) or `byId`.
        // We stored `storage_key` as B2 file ID in `FileVersion`.
        // So we should probably use that to download.
        // But our `download` endpoint assumes `files/[id]` refers to the main file record.
        // Usage: `api/files/download/[fileId]?versionId=...`?
        // Or if `storage_key` in version IS the B2 ID, maybe we can use that?
        // But `download` endpoint expects `params.fileId` to match a `files` DB record.
        // It doesn't look up `file_versions`.
        // So I can't easily download a previous version with current API unless I add support.
        // Implementation Detail: I'll disable download for now or just alert.
        // Or I can use the same `api/files/download/` but pass `versionId` query param.
        // Then `download` route can look up `file_versions` if `versionId` is present.

        alert("Downloading specific versions is not yet supported in this demo.");
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Version History</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                        <Icons.X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Icons.FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-slate-500">Current Version: v{file.current_version || 1}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No version history available.
                        </div>
                    ) : (
                        versions.map((version) => (
                            <div key={version.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400">
                                        v{version.version_number}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                                            {version.version_number === parseInt(file.current_version || "1") ? "Current Version" : `Version ${version.version_number}`}
                                        </p>
                                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                                            {new Date(version.uploaded_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Size: {(version.size / 1024 / 1024).toFixed(2)} MB • Uploaded by User
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDownloadVersion(version)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Download this version"
                                >
                                    <Icons.Download className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
