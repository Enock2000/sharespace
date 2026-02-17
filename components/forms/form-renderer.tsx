"use client";

import { FormField } from "@/types/database";
import FieldRenderer from "./field-renderer";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface FormRendererProps {
    title: string;
    description?: string;
    fields: FormField[];
    hasPassword: boolean;
    thankYouMessage: string;
    redirectUrl?: string;
    onSubmit: (answers: Record<string, any>, password?: string) => Promise<{ success: boolean; error?: string; field_id?: string }>;
}

export default function FormRenderer({
    title,
    description,
    fields,
    hasPassword,
    thankYouMessage,
    redirectUrl,
    onSubmit,
}: FormRendererProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [globalError, setGlobalError] = useState("");

    const handleFieldChange = (fieldId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [fieldId]: value }));
        // Clear error on change
        if (errors[fieldId]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const field of fields) {
            const value = answers[field.id];

            if (field.required) {
                if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
                    newErrors[field.id] = `${field.label} is required`;
                }
            }

            if (value && field.validation) {
                const v = field.validation;
                if ((field.type === "short_text" || field.type === "long_text") && v.min_length && String(value).length < v.min_length) {
                    newErrors[field.id] = `Must be at least ${v.min_length} characters`;
                }
                if ((field.type === "short_text" || field.type === "long_text") && v.max_length && String(value).length > v.max_length) {
                    newErrors[field.id] = `Must be at most ${v.max_length} characters`;
                }
                if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
                    newErrors[field.id] = "Must be a valid email address";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGlobalError("");

        if (!validate()) return;
        if (hasPassword && !password) {
            setGlobalError("Password is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onSubmit(answers, hasPassword ? password : undefined);
            if (result.success) {
                setIsSubmitted(true);
                if (redirectUrl) {
                    setTimeout(() => { window.location.href = redirectUrl; }, 2000);
                }
            } else {
                if (result.field_id) {
                    setErrors(prev => ({ ...prev, [result.field_id!]: result.error || "Invalid value" }));
                } else {
                    setGlobalError(result.error || "Submission failed");
                }
            }
        } catch (err) {
            setGlobalError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success view
    if (isSubmitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-10 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thank you!</h2>
                    <p className="text-slate-600 dark:text-slate-400">{thankYouMessage}</p>
                    {redirectUrl && (
                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">Redirecting...</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-5">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {description && <p className="text-blue-100 text-sm mt-1">{description}</p>}
                </div>

                {/* Password */}
                {hasPassword && (
                    <div className="px-6 pt-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="Enter form password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                )}

                {/* Fields */}
                <div className="p-6 space-y-6">
                    {fields.map((field) => (
                        <FieldRenderer
                            key={field.id}
                            field={field}
                            value={answers[field.id]}
                            onChange={(val) => handleFieldChange(field.id, val)}
                            error={errors[field.id]}
                        />
                    ))}
                </div>

                {globalError && (
                    <div className="mx-6 mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                        {globalError}
                    </div>
                )}

                {/* Submit */}
                <div className="px-6 pb-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Icons.Send className="w-4 h-4" />
                                Submit
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
