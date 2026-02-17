"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SignatureField } from "@/types/database";
import SigningFlow from "@/components/signatures/signing-flow";
import { Icons } from "@/components/ui/icons";

interface SigningData {
    request: { id: string; title: string; message?: string; document_url: string; document_name: string; document_pages: number };
    signer: { id: string; name: string; email: string; role: string };
    fields: SignatureField[];
}

export default function PublicSigningPage() {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<SigningData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/public/sign/${token}`);
                if (!res.ok) {
                    const err = await res.json();
                    setError(err.error || "Failed to load signing request");
                    return;
                }
                setData(await res.json());
            } catch {
                setError("Failed to load signing request");
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const handleSubmit = async (fieldValues: Record<string, string>) => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/public/sign/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field_values: fieldValues }),
            });
            const result = await res.json();
            if (!res.ok) {
                alert(result.error || "Failed to submit signature");
                return;
            }
            setSuccess(true);
            setSuccessMessage(result.status === "completed" ? "All signatures collected! The document is now complete." : "Your signature has been recorded successfully.");
        } catch {
            alert("Failed to submit signature");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!confirm("Are you sure you want to decline signing this document?")) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/public/sign/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ declined: true }),
            });
            if (res.ok) {
                setSuccess(true);
                setSuccessMessage("You have declined to sign this document.");
            }
        } catch {
            alert("Failed to process decline");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Loading document...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Icons.AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Unable to Load</h2>
                    <p className="text-slate-500 dark:text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-green-950">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Icons.CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Done!</h2>
                    <p className="text-slate-600 dark:text-slate-400">{successMessage}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-4">You can safely close this page.</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <SigningFlow
            requestTitle={data.request.title}
            requestMessage={data.request.message}
            signerName={data.signer.name}
            signerRole={data.signer.role}
            documentUrl={data.request.document_url}
            documentPages={data.request.document_pages}
            fields={data.fields}
            onSubmit={handleSubmit}
            onDecline={handleDecline}
            submitting={submitting}
        />
    );
}
