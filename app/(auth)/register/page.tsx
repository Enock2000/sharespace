"use client";

import { useState } from "react";
import { registerUser } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [companyName, setCompanyName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await registerUser(email, password);
            const user = userCredential.user;

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    companyName,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create tenant");
            }

            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center font-bold text-2xl">
                            S
                        </div>
                        <span className="text-3xl font-bold text-gradient">Shared Spaces</span>
                    </Link>
                    <p className="text-gray-400 mt-2">Start your 14-day free trial</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-6">Create Your Workspace</h2>

                    {error && (
                        <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200 flex items-start gap-3">
                            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Company Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    placeholder="Acme Corporation"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Work Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    placeholder="you@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Minimum 8 characters with uppercase and number</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating workspace...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Workspace</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Sign in instead
                        </Link>
                    </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span>14-day trial</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <span>No credit card</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <span>Unlimited users</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
