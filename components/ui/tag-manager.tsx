"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { FileTag } from "@/types/database";

const TAG_COLORS = [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
    { name: "Gray", value: "#6b7280" },
];

interface TagManagerProps {
    fileId: string;
    onTagsChange?: () => void;
}

export default function TagManager({ fileId, onTagsChange }: TagManagerProps) {
    const { user } = useAuth();
    const [allTags, setAllTags] = useState<FileTag[]>([]);
    const [fileTags, setFileTags] = useState<FileTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newTagName, setNewTagName] = useState("");
    const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

    const fetchTags = async () => {
        if (!user) return;
        try {
            // Fetch all tenant tags
            const allRes = await fetch(`/api/tags?userId=${user.uid}`);
            const allData = await allRes.json();
            setAllTags(allData.tags || []);

            // Fetch tags for this file
            const fileRes = await fetch(`/api/files/${fileId}/tags?userId=${user.uid}`);
            const fileData = await fileRes.json();
            setFileTags(fileData.tags || []);
        } catch (error) {
            console.error("Failed to fetch tags:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, [user, fileId]);

    const handleCreateTag = async () => {
        if (!user || !newTagName.trim()) return;
        try {
            const res = await fetch(`/api/tags?userId=${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName.trim(), color: newTagColor })
            });

            if (res.ok) {
                const data = await res.json();
                setAllTags(prev => [...prev, data.tag]);
                setNewTagName("");
                setShowCreate(false);
                // Automatically add to file
                await handleAddTag(data.tag.id);
            }
        } catch (error) {
            console.error("Failed to create tag:", error);
        }
    };

    const handleAddTag = async (tagId: string) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/files/${fileId}/tags?userId=${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tagId })
            });

            if (res.ok) {
                const tag = allTags.find(t => t.id === tagId);
                if (tag) {
                    setFileTags(prev => [...prev, tag]);
                    onTagsChange?.();
                }
            }
        } catch (error) {
            console.error("Failed to add tag:", error);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/files/${fileId}/tags?userId=${user.uid}&tagId=${tagId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setFileTags(prev => prev.filter(t => t.id !== tagId));
                onTagsChange?.();
            }
        } catch (error) {
            console.error("Failed to remove tag:", error);
        }
    };

    const availableTags = allTags.filter(t => !fileTags.find(ft => ft.id === t.id));

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Loading tags...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Current File Tags */}
            <div className="flex flex-wrap gap-2">
                {fileTags.map(tag => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    >
                        <Icons.Tag className="w-3 h-3" />
                        {tag.name}
                        <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="ml-1 hover:opacity-70"
                        >
                            <Icons.X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {fileTags.length === 0 && (
                    <span className="text-sm text-slate-400">No tags</span>
                )}
            </div>

            {/* Add Tags */}
            <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 5).map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border-2 border-dashed hover:border-solid transition-all"
                        style={{ borderColor: tag.color, color: tag.color }}
                    >
                        <Icons.Plus className="w-3 h-3" />
                        {tag.name}
                    </button>
                ))}

                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <Icons.Plus className="w-3 h-3" />
                    New Tag
                </button>
            </div>

            {/* Create Tag Form */}
            {showCreate && (
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag name..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />

                    <div className="flex flex-wrap gap-2">
                        {TAG_COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setNewTagColor(color.value)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${newTagColor === color.value ? "scale-110 border-slate-900 dark:border-white" : "border-transparent"
                                    }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateTag}
                            disabled={!newTagName.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => {
                                setShowCreate(false);
                                setNewTagName("");
                            }}
                            className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
