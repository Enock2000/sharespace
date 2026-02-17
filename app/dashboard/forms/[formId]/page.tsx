"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { Form, FormField, FormResponse, FormResponseStatus } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import FormBuilder from "@/components/forms/form-builder";
import FormPreview from "@/components/forms/form-preview";
import FormSettingsPanel from "@/components/forms/form-settings";
import ResponseTable from "@/components/forms/response-table";

type Tab = "build" | "preview" | "responses" | "settings";

export default function FormDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const formId = params?.formId as string;

    const [form, setForm] = useState<Form | null>(null);
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("build");
    const [hasChanges, setHasChanges] = useState(false);

    // Auto-save debounce ref
    const [saveTimeout, setSaveTimeoutState] = useState<NodeJS.Timeout | null>(null);

    const fetchForm = async () => {
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/forms/${formId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.form) setForm(data.form);
        } catch (err) {
            console.error("Error fetching form:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResponses = async () => {
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/forms/${formId}/responses`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.responses) setResponses(data.responses);
        } catch (err) {
            console.error("Error fetching responses:", err);
        }
    };

    useEffect(() => {
        if (formId && user) {
            fetchForm();
            fetchResponses();
        }
    }, [formId, user]);

    const saveForm = useCallback(async (updates: Partial<Form>) => {
        if (!formId) return;
        setSaving(true);
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/forms/${formId}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (data.form) {
                setForm(data.form);
                setHasChanges(false);
            }
        } catch (err) {
            console.error("Error saving form:", err);
        } finally {
            setSaving(false);
        }
    }, [formId, user]);

    const handleFieldsChange = (fields: FormField[]) => {
        if (!form) return;
        setForm({ ...form, fields });
        setHasChanges(true);

        // Debounce auto-save
        if (saveTimeout) clearTimeout(saveTimeout);
        const t = setTimeout(() => saveForm({ fields }), 1500);
        setSaveTimeoutState(t);
    };

    const handleTitleChange = (title: string) => {
        if (!form) return;
        setForm({ ...form, title });
        setHasChanges(true);

        if (saveTimeout) clearTimeout(saveTimeout);
        const t = setTimeout(() => saveForm({ title }), 1500);
        setSaveTimeoutState(t);
    };

    const handleDescriptionChange = (description: string) => {
        if (!form) return;
        setForm({ ...form, description });
        setHasChanges(true);

        if (saveTimeout) clearTimeout(saveTimeout);
        const t = setTimeout(() => saveForm({ description }), 1500);
        setSaveTimeoutState(t);
    };

    const handleSettingsChange = (settings: Partial<Form["settings"]>) => {
        if (!form) return;
        const updatedSettings = { ...form.settings, ...settings };
        setForm({ ...form, settings: updatedSettings });
        saveForm({ settings: updatedSettings });
    };

    const handleStatusChange = (status: "draft" | "published" | "closed") => {
        if (!form) return;
        setForm({ ...form, status });
        saveForm({ status });
    };

    const handleResponseStatusChange = async (responseId: string, status: FormResponseStatus) => {
        try {
            const token = await user!.getIdToken();
            await fetch(`/api/forms/${formId}/responses/${responseId}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            setResponses(prev => prev.map(r => r.id === responseId ? { ...r, status } : r));
        } catch (err) {
            console.error("Error updating response:", err);
        }
    };

    const handleResponseDelete = async (responseId: string) => {
        try {
            const token = await user!.getIdToken();
            await fetch(`/api/forms/${formId}/responses/${responseId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setResponses(prev => prev.filter(r => r.id !== responseId));
        } catch (err) {
            console.error("Error deleting response:", err);
        }
    };

    const handleExport = async () => {
        try {
            const token = await user!.getIdToken();
            const res = await fetch(`/api/forms/${formId}/responses/export`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${form?.title || "form"}_responses.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error exporting:", err);
        }
    };

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/f/${form?.settings?.share_token}`
        : "";

    const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: "build", label: "Build", icon: <Icons.Settings className="w-4 h-4" /> },
        { id: "preview", label: "Preview", icon: <Icons.Eye className="w-4 h-4" /> },
        { id: "responses", label: "Responses", icon: <Icons.Users className="w-4 h-4" />, count: responses.length },
        { id: "settings", label: "Settings", icon: <Icons.Shield className="w-4 h-4" /> },
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/2 rounded-xl" />
                <Skeleton className="h-8 w-full rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    if (!form) {
        return (
            <div className="text-center py-16">
                <Icons.AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                <h2 className="text-lg font-medium text-slate-600 dark:text-slate-400">Form not found</h2>
                <button
                    onClick={() => router.push("/dashboard/forms")}
                    className="mt-4 px-4 py-2 text-sm text-blue-500 hover:text-blue-700 transition-colors"
                >
                    ← Back to forms
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/dashboard/forms")}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <Icons.ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="flex-1">
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="text-2xl font-bold text-slate-900 dark:text-white bg-transparent outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors w-full"
                        placeholder="Form title..."
                    />
                    <input
                        type="text"
                        value={form.description || ""}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        className="text-sm text-slate-500 dark:text-slate-400 bg-transparent outline-none w-full mt-1"
                        placeholder="Add description..."
                    />
                </div>
                <div className="flex items-center gap-2">
                    {saving && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                            Saving...
                        </span>
                    )}
                    {!saving && hasChanges && (
                        <span className="text-xs text-amber-500">Unsaved changes</span>
                    )}
                    {!saving && !hasChanges && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                            <Icons.Check className="w-3 h-3" /> Saved
                        </span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "build" && (
                    <FormBuilder
                        fields={form.fields || []}
                        onChange={handleFieldsChange}
                    />
                )}

                {activeTab === "preview" && (
                    <FormPreview
                        title={form.title}
                        description={form.description}
                        fields={form.fields || []}
                    />
                )}

                {activeTab === "responses" && (
                    <ResponseTable
                        responses={responses}
                        fields={form.fields || []}
                        onStatusChange={handleResponseStatusChange}
                        onDelete={handleResponseDelete}
                        onExport={handleExport}
                    />
                )}

                {activeTab === "settings" && (
                    <FormSettingsPanel
                        settings={form.settings}
                        formStatus={form.status}
                        shareUrl={shareUrl}
                        onChange={handleSettingsChange}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </div>
        </div>
    );
}
