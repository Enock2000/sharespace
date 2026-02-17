"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter, useParams } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { SignatureRequest, SignatureField, Signer, SignatureAuditEntry } from "@/types/database";
import DocumentViewer from "@/components/signatures/document-viewer";
import FieldPlacer from "@/components/signatures/field-placer";
import SignerManager from "@/components/signatures/signer-manager";
import AuditTrail from "@/components/signatures/audit-trail";
import StatusBadge from "@/components/signatures/status-badge";

type Tab = "document" | "signers" | "audit";

export default function SignatureRequestDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const requestId = params.requestId as string;

    const [request, setRequest] = useState<SignatureRequest | null>(null);
    const [audit, setAudit] = useState<SignatureAuditEntry[]>([]);
    const [tab, setTab] = useState<Tab>("document");
    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);

    const fetchRequest = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/signatures/${requestId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setRequest(data.request);
                setAudit(data.audit || []);
            }
        } catch (err) {
            console.error("Failed to fetch:", err);
        } finally {
            setFetching(false);
        }
    }, [user, requestId]);

    useEffect(() => { fetchRequest(); }, [fetchRequest]);

    const saveRequest = async (updates: Partial<SignatureRequest>) => {
        if (!user || !request) return;
        try {
            setSaving(true);
            const token = await user.getIdToken();
            const res = await fetch(`/api/signatures/${requestId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                const data = await res.json();
                setRequest(data.request);
            }
        } catch (err) {
            console.error("Failed to save:", err);
        } finally {
            setSaving(false);
        }
    };

    const addSigner = async (name: string, email: string, role: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/signatures/${requestId}/signers`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, role }),
            });
            if (res.ok) {
                await fetchRequest();
            }
        } catch (err) {
            console.error("Failed to add signer:", err);
        }
    };

    const removeSigner = async (signerId: string) => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            await fetch(`/api/signatures/${requestId}/signers?signerId=${signerId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            await fetchRequest();
        } catch (err) {
            console.error("Failed to remove signer:", err);
        }
    };

    const sendForSigning = async () => {
        if (!request || (request.signers || []).length === 0) {
            alert("Add at least one signer before sending.");
            return;
        }
        if ((request.fields || []).length === 0) {
            alert("Place at least one field on the document before sending.");
            return;
        }
        if (!confirm("Send this document for signing? Signers will receive their signing links.")) return;
        try {
            setSending(true);
            await saveRequest({ status: "pending" });
            await fetchRequest();
        } catch (err) {
            console.error("Failed to send:", err);
        } finally {
            setSending(false);
        }
    };

    const cancelRequest = async () => {
        if (!confirm("Cancel this signing request?")) return;
        await saveRequest({ status: "cancelled" });
        await fetchRequest();
    };

    if (loading || fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    if (!request) {
        return (
            <div className="text-center py-16">
                <p className="text-slate-500">Request not found</p>
            </div>
        );
    }

    const isDraft = request.status === "draft";
    const isActive = request.status === "pending" || request.status === "in_progress";

    const tabList: { id: Tab; label: string }[] = [
        { id: "document", label: `Document${isDraft ? " & Fields" : ""}` },
        { id: "signers", label: `Signers (${(request.signers || []).length})` },
        { id: "audit", label: `Audit Trail (${audit.length})` },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard/signatures")}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Icons.ChevronRight className="w-5 h-5 rotate-180 text-slate-400" />
                    </button>
                    <div>
                        {isDraft ? (
                            <input
                                value={request.title}
                                onChange={(e) => setRequest(prev => prev ? { ...prev, title: e.target.value } : null)}
                                onBlur={() => saveRequest({ title: request.title })}
                                className="text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-1"
                            />
                        ) : (
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{request.title}</h1>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                            <StatusBadge status={request.status} size="md" />
                            <span className="text-sm text-slate-500 dark:text-slate-400">{request.document_name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {saving && <span className="text-xs text-slate-400 animate-pulse">Saving...</span>}
                    {isDraft && (
                        <button
                            onClick={sendForSigning}
                            disabled={sending}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-60 transition-all shadow-sm"
                        >
                            <Icons.Send className="w-4 h-4" />
                            {sending ? "Sending..." : "Send for Signing"}
                        </button>
                    )}
                    {isActive && (
                        <button
                            onClick={cancelRequest}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <Icons.X className="w-4 h-4" />
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {tabList.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t.id
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === "document" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" style={{ height: "650px" }}>
                        <DocumentViewer
                            documentUrl={request.document_url}
                            documentPages={request.document_pages}
                            fields={request.fields || []}
                            signerIndex={(sid) => (request.signers || []).findIndex(s => s.id === sid)}
                            interactive={isDraft}
                        />
                    </div>
                    {isDraft && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Place Fields</h3>
                            <FieldPlacer
                                fields={request.fields || []}
                                signers={request.signers || []}
                                currentPage={1}
                                onFieldsChange={(fields) => saveRequest({ fields })}
                            />
                        </div>
                    )}
                </div>
            )}

            {tab === "signers" && (
                <div className="max-w-xl">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Signers</h3>
                        <SignerManager
                            signers={request.signers || []}
                            signingOrder={request.signing_order}
                            onSigningOrderChange={(order) => saveRequest({ signing_order: order })}
                            onAddSigner={addSigner}
                            onRemoveSigner={removeSigner}
                            readOnly={!isDraft}
                        />

                        {/* Signing Links (for active requests) */}
                        {isActive && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Signing Links</h4>
                                {(request.signers || []).map((signer) => (
                                    <div key={signer.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{signer.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                                                {typeof window !== "undefined" ? `${window.location.origin}/sign/${signer.sign_token}` : `/sign/${signer.sign_token}`}
                                            </p>
                                        </div>
                                        <StatusBadge status={signer.status} />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/sign/${signer.sign_token}`);
                                            }}
                                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                        >
                                            <Icons.Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === "audit" && (
                <div className="max-w-2xl">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Audit Trail</h3>
                        <AuditTrail entries={audit} />
                    </div>
                </div>
            )}
        </div>
    );
}
