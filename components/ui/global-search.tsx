"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { File, Folder } from "@/types/database";
import { useRouter } from "next/navigation";

interface SearchResults {
    files: File[];
    folders: Folder[];
}

export default function GlobalSearch() {
    const { user } = useAuth();
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResults>({ files: [], folders: [] });
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    const searchDebounced = useCallback(
        debounce(async (searchQuery: string) => {
            if (!user || searchQuery.length < 2) {
                setResults({ files: [], folders: [] });
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/search?userId=${user.uid}&q=${encodeURIComponent(searchQuery)}&type=all&limit=10`);
                const data = await res.json();
                setResults(data.results || { files: [], folders: [] });
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [user]
    );

    useEffect(() => {
        if (query.length >= 2) {
            setLoading(true);
            searchDebounced(query);
        } else {
            setResults({ files: [], folders: [] });
        }
    }, [query, searchDebounced]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            const totalItems = results.folders.length + results.files.length;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % totalItems);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                handleSelect(selectedIndex);
            } else if (e.key === "Escape") {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const handleSelect = (index: number) => {
        const folderCount = results.folders.length;
        if (index < folderCount) {
            // Selected a folder
            router.push(`/dashboard/files?folder=${results.folders[index].id}`);
        } else {
            // Selected a file
            const file = results.files[index - folderCount];
            router.push(`/dashboard/files?preview=${file.id}`);
        }
        setIsOpen(false);
        setQuery("");
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return "";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const hasResults = results.files.length > 0 || results.folders.length > 0;

    return (
        <div className="relative flex-1 max-w-md" ref={searchRef}>
            <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search files and folders..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 transition-all outline-none"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {!hasResults && !loading ? (
                        <div className="p-6 text-center">
                            <Icons.Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            {/* Folders */}
                            {results.folders.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50">
                                        Folders
                                    </div>
                                    {results.folders.map((folder, index) => (
                                        <button
                                            key={folder.id}
                                            onClick={() => handleSelect(index)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left ${selectedIndex === index ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                }`}
                                        >
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <Icons.Folder className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                    {folder.name}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Files */}
                            {results.files.length > 0 && (
                                <div>
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase bg-slate-50 dark:bg-slate-700/50">
                                        Files
                                    </div>
                                    {results.files.map((file, index) => {
                                        const actualIndex = results.folders.length + index;
                                        return (
                                            <button
                                                key={file.id}
                                                onClick={() => handleSelect(actualIndex)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left ${selectedIndex === actualIndex ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                                    }`}
                                            >
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                    <Icons.File className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Search Tips */}
                    <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                        <p className="text-xs text-slate-400">
                            Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-xs">Enter</kbd> to select
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T;
}
