"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { db } from "@/lib/database/schema";
import { Form } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function FormsListPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "published" | "closed">("all");

    const fetchForms = async () => {
        if (!user) return;
        try {
            const userProfile = await db.get<any>(`users/${user.uid}`);
            if (!userProfile) return;

            const formsMap = await db.get<Record<string, Form>>("forms") || {};
            const tenantForms = Object.values(formsMap)
                .filter(f => f.tenant_id === userProfile.tenant_id)
                .sort((a, b) => b.created_at - a.created_at);

            setForms(tenantForms);
        } catch (err) {
            console.error("Error fetching forms:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchForms(); }, [user]);

    const createForm = async () => {
        try {
            setCreating(true);
            const token = await user!.getIdToken();
            const res = await fetch("/api/forms", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Untitled Form" }),
            });
            const data = await res.json();
            if (data.form?.id) {
                router.push(`/dashboard/forms/${data.form.id}`);
            }
        } catch (err) {
            console.error("Error creating form:", err);
        } finally {
            setCreating(false);
        }
    };

    const deleteForm = async (formId: string) => {
        if (!confirm("Delete this form and all its responses?")) return;
        try {
            const token = await user!.getIdToken();
            await fetch(`/api/forms/${formId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setForms(prev => prev.filter(f => f.id !== formId));
        } catch (err) {
            console.error("Error deleting form:", err);
        }
    };

    const filtered = forms.filter(f => {
        if (filterStatus !== "all" && f.status !== filterStatus) return false;
        if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const formatDate = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const STATUS_STYLES: Record<string, string> = {
        draft: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
        published: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        closed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.ClipboardList className="w-7 h-7 text-blue-500" />
                        Forms
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create and manage forms to collect data
                    </p>
                </div>
                <button
                    onClick={createForm}
                    disabled={creating}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                >
                    {creating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Icons.Plus className="w-4 h-4" />
                    )}
                    New Form
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search forms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{forms.length}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Forms</div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{forms.filter(f => f.status === "published").length}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Published</div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{forms.filter(f => f.status === "draft").length}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Drafts</div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{forms.reduce((sum, f) => sum + (f.response_count || 0), 0)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Responses</div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && forms.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Icons.ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-1">No forms yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">Start collecting data by creating your first form</p>
                    <button
                        onClick={createForm}
                        disabled={creating}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
                    >
                        Create Your First Form
                    </button>
                </div>
            )}

            {/* Forms grid */}
            {!loading && filtered.length > 0 && (
                <div className="grid gap-3">
                    {filtered.map(form => (
                        <div
                            key={form.id}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                            onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                                            {form.title}
                                        </h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[form.status]}`}>
                                            {form.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{form.fields?.length || 0} fields</span>
                                        <span>·</span>
                                        <span>{form.response_count || 0} responses</span>
                                        <span>·</span>
                                        <span>{formatDate(form.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); window.open(`/f/${form.settings?.share_token}`, "_blank"); }}
                                        className="p-2 text-slate-400 hover:text-blue-500 rounded-lg"
                                        title="Open public link"
                                    >
                                        <Icons.ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteForm(form.id); }}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg"
                                        title="Delete form"
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
