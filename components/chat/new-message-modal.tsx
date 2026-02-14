"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { User } from "@/types/database";
import { useAuth } from "@/lib/auth/auth-context";

interface NewMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartChat: (userId: string | null, email: string | null) => Promise<void>;
}

export function NewMessageModal({ isOpen, onClose, onStartChat }: NewMessageModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
    const [colleagues, setColleagues] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [externalEmail, setExternalEmail] = useState("");

    useEffect(() => {
        if (isOpen && activeTab === "internal") {
            fetchColleagues();
        }
    }, [isOpen, activeTab]);

    const fetchColleagues = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users"); // This endpoint returns tenant users
            const data = await res.json();
            setColleagues(data.users || []);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartInternal = (targetUser: User) => {
        onStartChat(targetUser.id, null);
    };

    const handleStartExternal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!externalEmail.trim()) return;
        onStartChat(null, externalEmail.trim());
    };

    const filteredColleagues = colleagues.filter(u =>
        u.id !== user?.uid &&
        (u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white">New Message</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab("internal")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "internal" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        Colleagues
                    </button>
                    <button
                        onClick={() => setActiveTab("external")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "external" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                        External
                    </button>
                </div>

                <div className="p-4 min-h-[300px] flex flex-col">
                    {activeTab === "internal" && (
                        <>
                            <div className="relative mb-4">
                                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search people..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                {loading ? (
                                    <div className="text-center py-8 opacity-50">Loading users...</div>
                                ) : filteredColleagues.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">No users found</div>
                                ) : (
                                    filteredColleagues.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleStartInternal(u)}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg text-left transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {u.first_name?.[0] || "?"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {u.first_name} {u.last_name}
                                                </p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "external" && (
                        <div className="flex flex-col h-full">
                            <p className="text-sm text-slate-500 mb-4">
                                Start a chat with someone from another organization by entering their email address.
                            </p>
                            <form onSubmit={handleStartExternal} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={externalEmail}
                                        onChange={(e) => setExternalEmail(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Start Conversation
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
