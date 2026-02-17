"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { SignatureRequest } from "@/types/database";
import RequestCard from "@/components/signatures/request-card";

type TabFilter = "all" | "draft" | "pending" | "in_progress" | "completed" | "cancelled";

export default function SignaturesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<SignatureRequest[]>([]);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<TabFilter>("all");
    const [fetching, setFetching] = useState(true);
    const [creating, setCreating] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/signatures", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
            }
        } catch (err) {
            console.error("Failed to fetch signatures:", err);
        } finally {
            setFetching(false);
        }
    }, [user]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const createRequest = async () => {
        if (!user) return;
        try {
            setCreating(true);
            const token = await user.getIdToken();
            const res = await fetch("/api/signatures", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Untitled Document", document_url: "", document_name: "document.pdf" }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/dashboard/signatures/${data.request.id}`);
            }
        } catch (err) {
            console.error("Failed to create request:", err);
        } finally {
            setCreating(false);
        }
    };

    const deleteRequest = async (id: string) => {
        if (!confirm("Delete this signature request?")) return;
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await fetch(`/api/signatures/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error("Failed to delete:", err);
        }
    };

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    const filtered = requests.filter(r => {
        if (tab !== "all" && r.status !== tab) return false;
        if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.document_name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === "pending" || r.status === "in_progress").length,
        completed: requests.filter(r => r.status === "completed").length,
        draft: requests.filter(r => r.status === "draft").length,
    };

    const tabs: { id: TabFilter; label: string; count: number }[] = [
        { id: "all", label: "All", count: stats.total },
        { id: "draft", label: "Drafts", count: stats.draft },
        { id: "pending", label: "Pending", count: stats.pending },
        { id: "completed", label: "Completed", count: stats.completed },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E-Signatures</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send documents for signing and track progress</p>
                </div>
                <button
                    onClick={createRequest}
                    disabled={creating}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-60 transition-all shadow-sm"
                >
                    <Icons.Plus className="w-4 h-4" />
                    {creating ? "Creating..." : "New Request"}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total", value: stats.total, color: "indigo" },
                    { label: "In Progress", value: stats.pending, color: "amber" },
                    { label: "Completed", value: stats.completed, color: "green" },
                    { label: "Drafts", value: stats.draft, color: "slate" },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs & Search */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id
                                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            {t.label}
                            <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">{t.count}</span>
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search requests..."
                        className="pl-10 pr-4 py-2 w-64 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            {/* Requests Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16">
                    <Icons.FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{search || tab !== "all" ? "No matching requests" : "No signature requests yet"}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first e-signature request to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((req) => (
                        <RequestCard key={req.id} request={req} onDelete={deleteRequest} />
                    ))}
                </div>
            )}
        </div>
    );
}
