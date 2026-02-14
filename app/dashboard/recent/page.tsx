"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { authFetch } from "@/lib/utils/api-client";
import { File } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { ShareModal } from "@/components/ui/share-modal";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import Link from "next/link";

export default function RecentPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharingFile, setSharingFile] = useState<File | null>(null);

    const [viewingFile, setViewingFile] = useState<File | null>(null); // Added state

    const fetchRecent = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authFetch("/api/recent", {}, user);
            const data = await res.json();
            if (data.files) {
                setFiles(data.files);
            }
        } catch (error) {
            console.error("Failed to fetch recent files:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecent();
    }, [user]);

    const handleDownload = async (file: File) => {
        if (!user) return;
        const token = await user.getIdToken();
        window.open(`/api/files/download/${file.id}?token=${token}`, "_blank");
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Clock className="w-6 h-6 text-blue-500" />
                        Recent Files
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Files you've accessed recently.
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : files.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Clock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No recent files</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        Files you view or download will appear here.
                    </p>
                    <Link
                        href="/dashboard/files"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Browse Files
                    </Link>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Size</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {files.map((file) => (
                                <tr
                                    key={file.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                                    onClick={() => setViewingFile(file)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg shrink-0 ${file.mime_type.startsWith("image/") ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                                file.mime_type.startsWith("video/") ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" :
                                                    file.mime_type.startsWith("audio/") ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                                        "bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                                }`}>
                                                {file.mime_type.startsWith("image/") ? <Icons.Image className="w-5 h-5" /> :
                                                    file.mime_type.startsWith("video/") ? <Icons.Video className="w-5 h-5" /> :
                                                        file.mime_type.startsWith("audio/") ? <span className="text-lg">🎵</span> :
                                                            <Icons.File className="w-5 h-5" />}
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {file.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {new Date(file.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSharingFile(file); }}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors"
                                                title="Share"
                                            >
                                                <Icons.Share2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Icons.Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <FilePreviewModal
                isOpen={!!viewingFile}
                file={viewingFile}
                onClose={() => setViewingFile(null)}
                onDownload={handleDownload}
            />

            {sharingFile && (
                <ShareModal
                    isOpen={true}
                    onClose={() => setSharingFile(null)}
                    fileId={sharingFile.id}
                    fileName={sharingFile.name}
                />
            )}
        </div>
    );
}
