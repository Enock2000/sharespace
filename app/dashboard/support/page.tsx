"use client";

import { useState } from "react";
import { Icons } from "@/components/ui/icons";
import { DeleteAccountModal } from "@/components/support/delete-account-modal";

const faqs = [
    {
        question: "How do I upgrade my storage limit?",
        answer: "You can upgrade your storage by visiting the Billing section in your Admin Settings. Choose a plan that fits your team's needs, and the storage limit will be updated immediately upon successful payment."
    },
    {
        question: "Are my files secure?",
        answer: "Yes, Shared Spaces uses end-to-end encryption. All files are encrypted at rest and in transit. Only authorized users within your tenant can access your uploaded documents."
    },
    {
        question: "How do I securely share a file with someone outside my team?",
        answer: "Open a file's context menu and select 'Share'. You can generate a secure share link. For added security, you can set a password and an expiration date on the link."
    },
    {
        question: "I accidentally deleted a file. Can I get it back?",
        answer: "Deleted files are moved to the Trash. You have 30 days to review and restore them before they are permanently purged from our servers."
    }
];

export default function SupportPage() {
    const [subject, setSubject] = useState("");
    const [messageText, setMessageText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !messageText.trim()) {
            setStatusMessage({ type: "error", text: "Subject and message are required" });
            return;
        }

        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            const response = await fetch("/api/support/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message: messageText }),
            });

            if (!response.ok) throw new Error("Failed to send message");

            setStatusMessage({ type: "success", text: "Support ticket submitted! We'll be in touch soon." });
            setSubject("");
            setMessageText("");
        } catch (error: any) {
            setStatusMessage({ type: "error", text: error.message || "An error occurred" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Icons.LifeBuoy className="w-8 h-8 text-indigo-500" />
                    Support Center
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Need help? Find answers to common questions or reach out to our team.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* FAQs Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-semibold text-lg">
                            <Icons.FileText className="w-5 h-5 text-indigo-500" />
                            Frequently Asked Questions
                        </div>

                        <div className="space-y-3">
                            {faqs.map((faq, idx) => (
                                <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                                    >
                                        <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{faq.question}</span>
                                        <Icons.ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                                    </button>
                                    {openFaq === idx && (
                                        <div className="p-4 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Form Section */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white font-semibold text-lg">
                            <Icons.Mail className="w-5 h-5 text-indigo-500" />
                            Contact Support
                        </div>

                        {statusMessage && (
                            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'}`}>
                                {statusMessage.type === 'success' ? <Icons.CheckCircle className="w-4 h-4 shrink-0" /> : <Icons.AlertTriangle className="w-4 h-4 shrink-0" />}
                                {statusMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Briefly describe your issue"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Provide more details so we can help you faster..."
                                    rows={5}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white resize-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Icons.Send className="w-4 h-4" />
                                )}
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>

            </div>

            {/* Danger Zone */}
            <div className="mt-8">
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
                    <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                        <div>
                            <h3 className="text-red-800 dark:text-red-400 font-semibold text-lg flex items-center gap-2">
                                <Icons.AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h3>
                            <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-1">
                                Permanently delete your account and remove all associated data. This action cannot be undone.
                            </p>
                        </div>
                        <button
                            className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            Request Account Deletion
                        </button>
                    </div>
                </div>
            </div>

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
}
