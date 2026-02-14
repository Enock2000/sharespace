"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { authFetch } from "@/lib/utils/api-client";
import { useAuth } from "@/lib/auth/auth-context";

interface TwoFactorSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function TwoFactorSetupModal({ isOpen, onClose, onSuccess }: TwoFactorSetupModalProps) {
    const { user } = useAuth();
    const [step, setStep] = useState<"loading" | "qr" | "verify">("loading");
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [token, setToken] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            initSetup();
        } else {
            // Reset state on close
            setStep("loading");
            setToken("");
            setError("");
        }
    }, [isOpen, user]);

    const initSetup = async () => {
        if (!user) return;
        setStep("loading");
        try {
            const res = await authFetch("/api/auth/2fa/setup", { method: "POST" }, user);
            if (res.ok) {
                const data = await res.json();
                setQrCodeUrl(data.qrCodeUrl);
                setSecret(data.secret);
                setStep("qr");
            } else {
                setError("Failed to initialize 2FA setup");
            }
        } catch (err) {
            setError("Failed to initialize 2FA setup");
        }
    };

    const handleVerify = async () => {
        if (!token || !user) return;
        setLoading(true);
        setError("");

        try {
            const res = await authFetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token })
            }, user);

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                setError(data.error || "Invalid code");
            }
        } catch (err) {
            setError("Failed to verify code");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Shield className="w-5 h-5 text-indigo-500" />
                        Setup Two-Factor Authentication
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <Icons.X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === "loading" && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Icons.Clock className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Generating secret...</p>
                        </div>
                    )}

                    {step === "qr" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.).
                                </p>
                                <div className="bg-white p-4 rounded-lg inline-block border border-slate-200">
                                    {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-mono break-all px-8">
                                    Secret: {secret}
                                </p>
                            </div>

                            <button
                                onClick={() => setStep("verify")}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                I've scanned it, Continue
                            </button>
                        </div>
                    )}

                    {step === "verify" && (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                                Enter the 6-digit code from your authenticator app to verify setup.
                            </p>

                            <div className="flex justify-center">
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-48 px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1">
                                    <Icons.AlertCircle className="w-4 h-4" />
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep("qr")}
                                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={loading || token.length !== 6}
                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Icons.Clock className="w-4 h-4 animate-spin" /> : "Verify & Enable"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
