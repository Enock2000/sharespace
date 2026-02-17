"use client";

import { FormSettings } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { useState } from "react";

interface FormSettingsProps {
    settings: FormSettings;
    formStatus: "draft" | "published" | "closed";
    shareUrl: string;
    onChange: (settings: Partial<FormSettings>) => void;
    onStatusChange: (status: "draft" | "published" | "closed") => void;
}

export default function FormSettingsPanel({
    settings,
    formStatus,
    shareUrl,
    onChange,
    onStatusChange,
}: FormSettingsProps) {
    const [copied, setCopied] = useState(false);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all";

    return (
        <div className="space-y-6">
            {/* Publishing Status */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <Icons.Activity className="w-4 h-4" />
                    Publishing
                </h3>

                <div className="flex gap-2">
                    {(["draft", "published", "closed"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => onStatusChange(s)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formStatus === s
                                    ? s === "published"
                                        ? "bg-green-500 text-white shadow-md"
                                        : s === "closed"
                                            ? "bg-red-500 text-white shadow-md"
                                            : "bg-slate-600 text-white shadow-md"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                                }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Share Link */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <Icons.Share2 className="w-4 h-4" />
                    Share Link
                </h3>

                <div className="flex gap-2">
                    <input
                        readOnly
                        value={shareUrl}
                        className={`${inputClass} bg-slate-50 dark:bg-slate-900 text-xs`}
                    />
                    <button
                        onClick={copyLink}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${copied
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white hover:bg-blue-600"
                            }`}
                    >
                        {copied ? <Icons.Check className="w-4 h-4" /> : <Icons.Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>

                {formStatus !== "published" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <Icons.AlertTriangle className="w-3 h-3" />
                        Publish the form to make this link active
                    </p>
                )}
            </div>

            {/* Access Control */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Icons.Shield className="w-4 h-4" />
                    Access Control
                </h3>

                {/* Password */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Password Protection</label>
                    <input
                        type="text"
                        className={inputClass}
                        value={settings.password || ""}
                        onChange={(e) => onChange({ password: e.target.value || undefined })}
                        placeholder="Leave empty for no password"
                    />
                </div>

                {/* Expiry */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Expiry Date</label>
                    <input
                        type="datetime-local"
                        className={inputClass}
                        value={settings.expires_at ? new Date(settings.expires_at).toISOString().slice(0, 16) : ""}
                        onChange={(e) => onChange({ expires_at: e.target.value ? new Date(e.target.value).getTime() : undefined })}
                    />
                </div>

                {/* Max Responses */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Max Responses</label>
                    <input
                        type="number"
                        className={inputClass}
                        value={settings.max_responses ?? ""}
                        onChange={(e) => onChange({ max_responses: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Unlimited"
                        min={1}
                    />
                </div>

                {/* One per user */}
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => onChange({ one_per_user: !settings.one_per_user })}>
                    <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${settings.one_per_user ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${settings.one_per_user ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Limit to 1 response per user</span>
                </label>
            </div>

            {/* Thank You */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4" />
                    After Submission
                </h3>

                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Thank You Message</label>
                    <textarea
                        className={`${inputClass} min-h-[80px] resize-y`}
                        value={settings.thank_you_message || ""}
                        onChange={(e) => onChange({ thank_you_message: e.target.value })}
                        placeholder="Thank you for your response!"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Redirect URL (optional)</label>
                    <input
                        type="url"
                        className={inputClass}
                        value={settings.redirect_url || ""}
                        onChange={(e) => onChange({ redirect_url: e.target.value || undefined })}
                        placeholder="https://example.com/thank-you"
                    />
                </div>
            </div>
        </div>
    );
}
