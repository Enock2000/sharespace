"use client";

import { useState, useEffect } from "react";
import { File, Folder } from "@/types/database";
import { useAuth } from "@/lib/auth/auth-context";
import { authFetch } from "@/lib/utils/api-client";
import { Icons } from "@/components/ui/icons";

interface MoveCopyModalProps {
    file: File;
    mode: "move" | "copy";
    onClose: () => void;
    onComplete: () => void;
}

export function MoveCopyModal({ file, mode, onClose, onComplete }: MoveCopyModalProps) {
    const { user } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null means root

    // Flattened folder list or tree? 
    // For simplicity, let's fetch all folders and show as a list or simple selection.
    // Ideally a tree, but a flat list with path indication is easier for now.
    // Or just "Root" and first-level folders?
    // Let's list all folders.

    useEffect(() => {
        const fetchFolders = async () => {
            if (!user) return;
            try {
                // Fetch all items from root to get folders (assuming getFolderContents doesn't recruit recursively)
                // Actually `getFolderContents` returns all folders flatted if I recall correctly? 
                // Wait, `getFolderContents` filters by parentId.
                // I need ALL folders to allow moving to any folder.
                // Does API support fetching all folders?
                // `api/files` fetches contents of a specific folder.
                // Creating a new endpoint `api/folders` (GET) to list all folders might be needed.
                // Or I can just fetch root and let user navigate?
                // Navigation is better UI. User starts at Root, sees folders, double clicks to enter, selects to choose.

                // Let's implement navigation style.
                await fetchFolderContents(null);
            } catch (error) {
                console.error("Failed to fetch folders:", error);
            }
        };

        fetchFolders();
    }, [user]);

    const fetchFolderContents = async (folderId: string | null) => {
        if (!user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (folderId) params.append("folderId", folderId);
            // We want ONLY folders.

            const res = await authFetch(`/api/files?${params.toString()}`, {}, user);
            const data = await res.json();
            if (data.folders) {
                setFolders(data.folders);
            }
        } catch (error) {
            console.error("Error fetching folders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folder: Folder) => {
        // Since we want to SELECT a folder, single click should select, double click (or separate button) to enter?
        // Let's make it simple: List shows current level folders. 
        // User can "Enter" a folder to see subfolders.
        // User can "Select Current Location" to move/copy here.
        // Or "Select [Folder Name]" to move/copy INTO that folder.
        // Simpler: Click to select (highlight). Double click to enter.
        setSelectedFolderId(folder.id);
    };

    const handleEnterFolder = (folder: Folder) => {
        setSelectedFolderId(null); // Reset selection in new view
        // But we are IN this folder now. So selected target defaults to this folder?
        // Let's store `currentViewFolderId`.
        setCurrentViewFolderId(folder.id);
        fetchFolderContents(folder.id);
    };

    const [currentViewFolderId, setCurrentViewFolderId] = useState<string | null>(null);

    const handleGoUp = async () => {
        // Need to know parent of current folder.
        // Since we don't have full tree, we might need to fetch current folder details to get parent.
        // Or keep a history stack.
        // Implementation Detail: history stack is easier.
        // For MVP: "Move/Copy to Root" button always available?
        // Or just a "Go to Root" button.
        setCurrentViewFolderId(null);
        fetchFolderContents(null);
        setSelectedFolderId(null);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            // Target is selected folder, OR current view if nothing selected?
            // "Move here" usually means move to `currentViewFolderId`.
            // If I selected a folder, maybe I mean move into that?
            // Let's say: "Move to [Current Location]" button if nothing selected.
            // "Move to [Selected Folder]" if folder selected.

            const targetId = selectedFolderId || currentViewFolderId;

            // Prevent moving into self or children (moved file is file, so children logic only applies if moving folder)
            // But we are moving a file. So just ensure we don't move file to same folder it is already in.
            if (targetId === file.folder_id || (!targetId && !file.folder_id)) {
                alert("File is already in this folder.");
                setSubmitting(false);
                return;
            }

            const endpoint = mode === "move" ? "/api/files/move" : "/api/files/copy";
            const res = await authFetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: file.id,
                    destinationFolderId: targetId
                })
            }, user);

            if (res.ok) {
                onComplete();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || `Failed to ${mode} file`);
            }
        } catch (error) {
            console.error(`${mode} error:`, error);
            alert(`Failed to ${mode} file`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white capitalize">
                        {mode} "{file.name}"
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors">
                        <Icons.X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-slate-100 dark:bg-slate-900/30">
                    <button
                        onClick={handleGoUp}
                        disabled={!currentViewFolderId}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded disabled:opacity-30 transition-colors"
                        title="Go to Root"
                    >
                        <Icons.Home className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-500 font-mono">
                        {currentViewFolderId ? "/ ... / Current" : "/ Root"}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[200px]">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            <Icons.Folder className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            No folders here
                        </div>
                    ) : (
                        folders.map((folder) => (
                            <div
                                key={folder.id}
                                onClick={() => handleFolderClick(folder)}
                                onDoubleClick={() => handleEnterFolder(folder)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${selectedFolderId === folder.id
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                        : "bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    }`}
                            >
                                <Icons.Folder className={`w-5 h-5 ${selectedFolderId === folder.id ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`} />
                                <span className={`text-sm ${selectedFolderId === folder.id ? "font-medium text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-slate-300"}`}>
                                    {folder.name}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                        {mode === "move" ? "Move Here" : "Copy Here"}
                    </button>
                </div>
            </div>
        </div>
    );
}
