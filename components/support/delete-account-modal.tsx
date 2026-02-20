"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/icons";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
    const [confirmText, setConfirmText] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    const isConfirmValid = confirmText === "DELETE";

    if (!isOpen) return null;

    const handleDeleteRequest = async () => {
        if (!isConfirmValid) return;

        setIsSubmitting(true);
        setMessage(null);
        try {
            const response = await fetch("/api/support/delete-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit request");
            }

            setMessage({ type: "success", text: "Account deletion request submitted. Check your email." });
            setTimeout(() => {
                onClose();
                setMessage(null);
                setConfirmText("");
                setReason("");
            }, 3000);
        } catch (error: any) {
            setMessage({ type: "error", text: error.message || "An error occurred" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Icons.AlertTriangle className="w-6 h-6 text-red-500" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account</h2>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        This action cannot be undone. This will permanently delete your account, files, and teams.
                    </p>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                            {message.type === 'success' ? <Icons.CheckCircle className="w-4 h-4 shrink-0" /> : <Icons.AlertTriangle className="w-4 h-4 shrink-0" />}
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">Reason for leaving (Optional)</label>
                            <input
                                placeholder="Why are you deleting your account?"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-900 dark:text-white">
                                To confirm, type <strong className="select-none text-red-600 dark:text-red-400">DELETE</strong> below:
                            </label>
                            <input
                                placeholder="DELETE"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-red-600 dark:text-red-400 font-mono font-medium"
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDeleteRequest}
                        disabled={!isConfirmValid || isSubmitting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
