"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { FileComment } from "@/types/database";

interface CommentWithUser extends FileComment {
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
    } | null;
}

interface CommentsPanelProps {
    fileId: string;
    fileName: string;
}

export default function CommentsPanel({ fileId, fileName }: CommentsPanelProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<CommentWithUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const fetchComments = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/files/${fileId}/comments?userId=${user.uid}`);
            const data = await res.json();
            setComments(data.comments || []);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [user, fileId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/files/${fileId}/comments?userId=${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() })
            });

            if (res.ok) {
                const data = await res.json();
                setComments(prev => [...prev, data.comment]);
                setNewComment("");
            }
        } catch (error) {
            console.error("Failed to add comment:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!user || !confirm("Delete this comment?")) return;

        try {
            const res = await fetch(`/api/files/${fileId}/comments?userId=${user.uid}&commentId=${commentId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId));
            }
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const handleResolve = async (commentId: string, resolved: boolean) => {
        if (!user) return;

        try {
            const res = await fetch(`/api/files/${fileId}/comments?userId=${user.uid}&commentId=${commentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_resolved: resolved })
            });

            if (res.ok) {
                setComments(prev => prev.map(c =>
                    c.id === commentId ? { ...c, is_resolved: resolved } : c
                ));
            }
        } catch (error) {
            console.error("Failed to update comment:", error);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const renderContent = (content: string) => {
        // Highlight @mentions
        return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>');
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Icons.MessageCircle className="w-4 h-4" />
                    Comments
                    {comments.length > 0 && (
                        <span className="ml-auto text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            {comments.length}
                        </span>
                    )}
                </h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                        <Icons.MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            No comments yet
                        </p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs">
                            Be the first to comment on this file
                        </p>
                    </div>
                ) : (
                    comments.map(comment => (
                        <div
                            key={comment.id}
                            className={`group relative ${comment.is_resolved ? "opacity-60" : ""
                                }`}
                        >
                            <div className="flex gap-3">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                                    {comment.user?.first_name?.[0] || "?"}
                                </div>

                                <div className="flex-1 min-w-0">
                                    {/* Header */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {comment.user ? `${comment.user.first_name} ${comment.user.last_name}` : "Unknown User"}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {formatTime(comment.created_at)}
                                        </span>
                                        {comment.is_resolved && (
                                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">
                                                Resolved
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <p
                                        className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: renderContent(comment.content) }}
                                    />

                                    {/* Actions */}
                                    <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleResolve(comment.id, !comment.is_resolved)}
                                            className="text-xs text-slate-500 hover:text-green-600 flex items-center gap-1"
                                        >
                                            <Icons.Check className="w-3 h-3" />
                                            {comment.is_resolved ? "Unresolve" : "Resolve"}
                                        </button>
                                        {(comment.user_id === user?.uid) && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <Icons.Trash className="w-3 h-3" />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {user?.displayName?.[0] || "Y"}
                    </div>
                    <div className="flex-1">
                        <textarea
                            ref={inputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment... Use @name to mention someone"
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                type="submit"
                                disabled={!newComment.trim() || submitting}
                                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Icons.MessageCircle className="w-4 h-4" />
                                        Comment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
