"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth/auth-context";

interface ShareModalProps {
    fileId: string;
    fileName: string;
    isOpen: boolean;
    onClose: () => void;
}

interface ShareLink {
    id: string;
    token: string;
    is_active: boolean;
    expires_at?: number;
    has_password?: boolean; // We don't get the hash back
    access_count: number;
}

export function ShareModal({ fileId, fileName, isOpen, onClose }: ShareModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"link" | "people">("link");
    const [links, setLinks] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(false);

    // Create Link Form
    const [password, setPassword] = useState("");
    const [expiration, setExpiration] = useState("");
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            fetchLinks();
        }
    }, [isOpen, user, fileId]);

    const fetchLinks = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/files/${fileId}/share/link?userId=${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                setLinks(data.links);
            }
        } catch (error) {
            console.error("Failed to fetch links", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLink = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/files/${fileId}/share/link?userId=${user.uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: password || undefined,
                    expiresAt: expiration || undefined
                })
            });

            if (res.ok) {
                const data = await res.json();
                setLinks(prev => [...prev, data.link]);
                setShowOptions(false);
                setPassword("");
                setExpiration("");
            }
        } catch (error) {
            console.error("Failed to create link", error);
            alert("Failed to create link");
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeLink = async (linkId: string) => {
        if (!user || !confirm("Revoke this link? It will stop working immediately.")) return;
        try {
            const res = await fetch(`/api/files/${fileId}/share/link?userId=${user.uid}&linkId=${linkId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setLinks(prev => prev.filter(l => l.id !== linkId));
            }
        } catch (error) {
            console.error("Failed to revoke link", error);
        }
    };

    const copyToClipboard = (token: string) => {
        const url = `${window.location.origin}/share/${token}`;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Share2 className="w-5 h-5 text-indigo-500" />
                        Share "{fileName}"
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab("link")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "link" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Share via Link
                    </button>
                    <button
                        onClick={() => setActiveTab("people")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "people" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Invite People
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === "link" && (
                        <div className="space-y-6">
                            {/* Create New Link Section */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">New Share Link</h4>
                                    <button
                                        onClick={() => setShowOptions(!showOptions)}
                                        className="text-xs text-indigo-600 hover:underline"
                                    >
                                        {showOptions ? "Hide Options" : "Show Options"}
                                    </button>
                                </div>

                                {showOptions && (
                                    <div className="space-y-3 mb-4 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Set Password (Optional)</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                                placeholder="Protect this link..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Expiration Date (Optional)</label>
                                            <input
                                                type="date"
                                                value={expiration}
                                                onChange={(e) => setExpiration(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateLink}
                                    disabled={loading}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? <Icons.Clock className="w-4 h-4 animate-spin" /> : <Icons.Link className="w-4 h-4" />}
                                    Generate Link
                                </button>
                            </div>

                            {/* Active Links List */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Links</h4>
                                {links.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No active links for this file.</p>
                                ) : (
                                    links.map(link => (
                                        <div key={link.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-xs font-mono text-slate-500 truncate" title={link.token}>
                                                        ...{link.token.substring(0, 8)}
                                                    </p>
                                                    {link.has_password && <span title="Password Protected"><Icons.Lock className="w-3 h-3 text-orange-500" /></span>}
                                                    {link.expires_at && <span title={`Expires: ${new Date(link.expires_at).toLocaleDateString()}`}><Icons.Clock className="w-3 h-3 text-blue-500" /></span>}
                                                </div>
                                                <p className="text-xs text-slate-400">{link.access_count} views</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => copyToClipboard(link.token)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                                                    title="Copy Link"
                                                >
                                                    <Icons.Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRevokeLink(link.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                    title="Revoke Link"
                                                >
                                                    <Icons.Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "people" && (
                        <div className="text-center py-8 text-slate-500">
                            <Icons.Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>Direct invitations coming in Phase 2</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
