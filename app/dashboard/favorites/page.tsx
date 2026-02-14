"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { authFetch } from "@/lib/utils/api-client";
import { File } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { ShareModal } from "@/components/ui/share-modal";
import { FilePreviewModal } from "@/components/ui/file-preview-modal";
import Link from "next/link";

export default function FavoritesPage() {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharingFile, setSharingFile] = useState<File | null>(null);
    const [viewingFile, setViewingFile] = useState<File | null>(null);

    const fetchFavorites = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await authFetch("/api/favorites", {}, user);
            const data = await res.json();
            if (data.favorites) {
                setFavorites(data.favorites);
            }
        } catch (error) {
            console.error("Failed to fetch favorites:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [user]);

    const handleRemoveFavorite = async (fileId: string) => {
        if (!user) return;
        try {
            // Optimistic update
            setFavorites(prev => prev.filter(f => f.id !== fileId));

            const res = await authFetch(`/api/favorites?fileId=${fileId}`, {
                method: "DELETE"
            }, user);

            if (!res.ok) {
                // Revert on failure
                fetchFavorites();
                console.error("Failed to remove favorite");
            }
        } catch (error) {
            console.error("Error removing favorite:", error);
            fetchFavorites();
        }
    };

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
                        <Icons.Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        Favorites
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Quick access to your most important files.
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Star className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No favorites yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                        Mark files as favorites to access them quickly from this page.
                    </p>
                    <Link
                        href="/dashboard/files"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Browse Files
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {favorites.map((file) => (
                        <div
                            key={file.id}
                            className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all group relative shadow-sm hover:shadow-md flex flex-col cursor-pointer"
                            onClick={() => setViewingFile(file)}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`p-2 rounded-lg shrink-0 ${file.mime_type.startsWith("image/") ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                                    file.mime_type.startsWith("video/") ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" :
                                        file.mime_type.startsWith("audio/") ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                                            "bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                    }`}>
                                    {file.mime_type.startsWith("image/") ? <Icons.Image className="w-6 h-6" /> :
                                        file.mime_type.startsWith("video/") ? <Icons.Video className="w-6 h-6" /> :
                                            file.mime_type.startsWith("audio/") ? <span className="text-xl">🎵</span> :
                                                <Icons.File className="w-6 h-6" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-slate-900 dark:text-white truncate" title={file.name}>
                                        {file.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                <span className="text-xs text-slate-400">
                                    {new Date(file.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1">
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
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(file.id); }}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-yellow-500 hover:text-red-500 rounded-lg transition-colors"
                                        title="Remove from favorites"
                                    >
                                        <Icons.Star className="w-4 h-4 fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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
