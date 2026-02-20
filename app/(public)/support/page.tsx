"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";

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
    },
    {
        question: "How do I request account deletion?",
        answer: "Log in to your dashboard and navigate to Dashboard → Support. At the bottom of the page you'll find a 'Danger Zone' section where you can request permanent account deletion. Alternatively, you can email support@sharedspacesoi.com."
    },
    {
        question: "How long does account deletion take?",
        answer: "Once you submit a deletion request, our team will process it within 30 days in accordance with applicable data protection regulations. You will receive an email confirmation once your data has been removed."
    }
];

export default function PublicSupportPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            setStatusMessage({ type: "error", text: "Subject and message are required." });
            return;
        }

        setIsSubmitting(true);
        setStatusMessage(null);
        try {
            const res = await fetch("/api/support/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            setStatusMessage({ type: "success", text: "Message sent! We'll get back to you soon." });
            setSubject("");
            setMessage("");
        } catch {
            setStatusMessage({ type: "error", text: "Something went wrong. Please try again or email us directly." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                            <Image src="/logo.png" alt="Logo" fill className="object-cover" />
                        </div>
                        <span className="text-xl font-bold text-slate-900 dark:text-white">SharedSpaces</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/login" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium">
                            Log in
                        </Link>
                        <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div className="bg-gradient-to-b from-indigo-600 to-indigo-700 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <Icons.LifeBuoy className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h1 className="text-4xl font-bold mb-3">Support Center</h1>
                    <p className="text-indigo-100 text-lg">Find answers, get help, or reach out to our team.</p>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

                {/* FAQs */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Icons.FileText className="w-6 h-6 text-indigo-500" />
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                                >
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{faq.question}</span>
                                    <Icons.ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${openFaq === idx ? "rotate-180" : ""}`} />
                                </button>
                                {openFaq === idx && (
                                    <div className="px-5 pb-5 text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact Form */}
                <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Icons.Mail className="w-6 h-6 text-indigo-500" />
                        Contact Us
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll respond as soon as possible.
                    </p>

                    {statusMessage && (
                        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${statusMessage.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"}`}>
                            {statusMessage.type === "success" ? <Icons.CheckCircle className="w-4 h-4 shrink-0" /> : <Icons.AlertTriangle className="w-4 h-4 shrink-0" />}
                            {statusMessage.text}
                        </div>
                    )}

                    <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Briefly describe your issue"
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Provide more details so we can help you faster..."
                                rows={5}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white resize-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Icons.Loader2 className="w-4 h-4 animate-spin" /> : <Icons.Send className="w-4 h-4" />}
                            Send Message
                        </button>
                    </form>
                </section>

                {/* Account Deletion Info */}
                <section className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                        <Icons.AlertTriangle className="w-6 h-6" />
                        Account Deletion
                    </h2>
                    <p className="text-red-600/80 dark:text-red-400/80 mb-4">
                        If you would like to permanently delete your SharedSpaces account and all associated data, you can do so from within your dashboard.
                    </p>
                    <ol className="text-red-600/80 dark:text-red-400/80 list-decimal list-inside space-y-2 mb-6 text-sm">
                        <li>Log in to your SharedSpaces account</li>
                        <li>Navigate to <strong>Dashboard → Support</strong></li>
                        <li>Scroll to the <strong>Danger Zone</strong> section at the bottom</li>
                        <li>Click <strong>&quot;Request Account Deletion&quot;</strong></li>
                        <li>Type <strong>DELETE</strong> to confirm and submit</li>
                    </ol>
                    <p className="text-red-600/80 dark:text-red-400/80 text-sm">
                        Alternatively, you can email us at <a href="mailto:support@sharedspacesoi.com" className="underline font-medium">support@sharedspacesoi.com</a> with the subject &quot;Account Deletion Request&quot;.
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/dashboard/support"
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Go to Dashboard Support
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            &copy; {new Date().getFullYear()} SharedSpaces. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6 text-sm">
                            <Link href="/terms" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Terms</Link>
                            <Link href="/privacy" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
