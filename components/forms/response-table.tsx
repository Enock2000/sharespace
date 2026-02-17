"use client";

import { FormResponse, FormField, FormResponseStatus } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { useState, useMemo } from "react";

interface ResponseTableProps {
    responses: FormResponse[];
    fields: FormField[];
    onStatusChange: (responseId: string, status: FormResponseStatus) => void;
    onDelete: (responseId: string) => void;
    onExport: () => void;
}

const STATUS_CONFIG: Record<FormResponseStatus, { label: string; color: string; bg: string }> = {
    new: { label: "New", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
    in_review: { label: "In Review", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
    approved: { label: "Approved", color: "text-green-700 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
    rejected: { label: "Rejected", color: "text-red-700 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
};

export default function ResponseTable({ responses, fields, onStatusChange, onDelete, onExport }: ResponseTableProps) {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FormResponseStatus | "all">("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    const filtered = useMemo(() => {
        let result = [...responses];

        if (filterStatus !== "all") {
            result = result.filter(r => r.status === filterStatus);
        }

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(r => {
                const email = (r.respondent_email || "").toLowerCase();
                const answerValues = Object.values(r.answers || {}).map(v => String(v).toLowerCase()).join(" ");
                return email.includes(q) || answerValues.includes(q);
            });
        }

        result.sort((a, b) => sortOrder === "newest"
            ? b.submitted_at - a.submitted_at
            : a.submitted_at - b.submitted_at
        );

        return result;
    }, [responses, filterStatus, search, sortOrder]);

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
            " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };

    const getDisplayValue = (field: FormField, value: any): string => {
        if (value === undefined || value === null) return "—";
        if (Array.isArray(value)) return value.join(", ");
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (field.type === "rating") return `${"★".repeat(value)}${"☆".repeat((field.validation?.max || 5) - value)}`;
        if (field.type === "signature") return value ? "[Signature]" : "—";
        if (field.type === "file_upload") return value?.name || "[File]";
        return String(value);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search responses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="in_review">In Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                        className="px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                    >
                        <Icons.ArrowDown className={`w-4 h-4 transition-transform ${sortOrder === "oldest" ? "rotate-180" : ""}`} />
                        {sortOrder === "newest" ? "Newest" : "Oldest"}
                    </button>
                    <button
                        onClick={onExport}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <Icons.Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["new", "in_review", "approved", "rejected"] as FormResponseStatus[]).map(s => {
                    const count = responses.filter(r => r.status === s).length;
                    const cfg = STATUS_CONFIG[s];
                    return (
                        <div key={s} className={`px-4 py-3 rounded-xl ${cfg.bg} border border-transparent`}>
                            <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{cfg.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Response Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-12">
                    <Icons.ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">No responses yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((r) => {
                        const isExpanded = expandedId === r.id;
                        const cfg = STATUS_CONFIG[r.status];
                        return (
                            <div key={r.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-shadow hover:shadow-md">
                                {/* Summary row */}
                                <div
                                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                >
                                    <Icons.ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {r.respondent_email || `Response #${r.id.slice(-6)}`}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                            {formatDate(r.submitted_at)}
                                        </p>
                                    </div>
                                    {/* Quick status change */}
                                    <select
                                        value={r.status}
                                        onChange={(e) => { e.stopPropagation(); onStatusChange(r.id, e.target.value as FormResponseStatus); }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 outline-none"
                                    >
                                        <option value="new">New</option>
                                        <option value="in_review">In Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (confirm("Delete this response?")) onDelete(r.id); }}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <div className="space-y-3">
                                            {fields.map(field => (
                                                <div key={field.id} className="grid grid-cols-3 gap-2 text-sm">
                                                    <span className="text-slate-500 dark:text-slate-400 font-medium">{field.label}</span>
                                                    <span className="col-span-2 text-slate-800 dark:text-slate-200">
                                                        {getDisplayValue(field, r.answers?.[field.id])}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Showing {filtered.length} of {responses.length} responses
            </p>
        </div>
    );
}
