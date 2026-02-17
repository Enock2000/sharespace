"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import FormRenderer from "@/components/forms/form-renderer";
import { Icons } from "@/components/ui/icons";

interface PublicForm {
    id: string;
    title: string;
    description?: string;
    fields: any[];
    settings: {
        thank_you_message: string;
        redirect_url?: string;
        has_password: boolean;
    };
}

export default function PublicFormPage() {
    const params = useParams();
    const token = params?.token as string;

    const [form, setForm] = useState<PublicForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const res = await fetch(`/api/public/forms/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setForm(data.form);
                } else {
                    setError(data.error || "Form not found");
                }
            } catch {
                setError("Failed to load form");
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchForm();
    }, [token]);

    const handleSubmit = async (answers: Record<string, any>, password?: string) => {
        try {
            const res = await fetch(`/api/public/forms/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, password }),
            });
            const data = await res.json();
            if (res.ok) {
                return { success: true };
            }
            return { success: false, error: data.error, field_id: data.field_id };
        } catch {
            return { success: false, error: "Submission failed" };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-10 text-center max-w-md">
                    <Icons.AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Oops!</h2>
                    <p className="text-slate-600 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!form) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
            <FormRenderer
                title={form.title}
                description={form.description}
                fields={form.fields}
                hasPassword={form.settings.has_password}
                thankYouMessage={form.settings.thank_you_message}
                redirectUrl={form.settings.redirect_url}
                onSubmit={handleSubmit}
            />
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
                Powered by ShareSpace
            </p>
        </div>
    );
}
