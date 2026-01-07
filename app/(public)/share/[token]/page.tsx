"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";

interface FileInfo {
    name: string;
    size: number;
    type: string;
    url: string;
    updated_at: number;
}

export default function PublicSharePage({ params }: { params: { token: string } }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<FileInfo | null>(null);
    const [requiresPassword, setRequiresPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [unlocking, setUnlocking] = useState(false);

    useEffect(() => {
        validateLink();
    }, [params.token]);

    const validateLink = async () => {
        try {
            const res = await fetch(`/api/public/share/${params.token}`);
            if (res.ok) {
                const data = await res.json();
                if (data.requiresPassword) {
                    setRequiresPassword(true);
                } else {
                    setFile(data.file);
                }
            } else {
                const err = await res.json();
                setError(err.error || "Failed to load link");
            }
        } catch (e) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setUnlocking(true);
        setError(null);
        try {
            const res = await fetch(`/api/public/share/${params.token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                const data = await res.json();
                setFile(data.file);
                setRequiresPassword(false);
            } else {
                const err = await res.json();
                setError(err.error || "Invalid password");
            }
        } catch (e) {
            setError("Failed to unlock");
        } finally {
            setUnlocking(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error && !requiresPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-red-100 dark:border-red-900/30 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-slate-500 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (requiresPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-w-md w-full">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Protected File</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                        This file is password protected.
                    </p>

                    <form onSubmit={handleUnlock}>
                        <div className="mb-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Enter password..."
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={unlocking || !password}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {unlocking ? <Icons.RefreshCw className="w-5 h-5 animate-spin" /> : <Icons.Lock className="w-5 h-5" />}
                            Access File
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mb-4">
                        <Icons.File className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 break-all">
                        {file?.name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {file && formatSize(file.size)} • {file?.type}
                    </p>
                </div>

                <div className="space-y-4">
                    <a
                        href={file?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
                    >
                        <Icons.Download className="w-5 h-5" />
                        Download File
                    </a>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
                        <Icons.Shield className="w-4 h-4" />
                        Securely shared via ShareSpace
                    </p>
                </div>
            </div>
        </div>
    );
}

// Add makeshift icons for specific page usage if needed or ensure they exist
// Icons.Key and Icons.IsLoading are not standard I think.
// I will just use Icons.Lock and Icons.RefreshCw instead if I can't edit Icons easily.
// Actually I will verify icons existence next.
