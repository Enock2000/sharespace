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
            // 1. Create user in Firebase Auth
            const userCredential = await registerUser(email, password);
            const user = userCredential.user;

            // 2. Call API to create tenant and user profile
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white/10 p-8 backdrop-blur-xl shadow-2xl border border-white/20">
                <h2 className="mb-6 text-center text-3xl font-bold text-white">
                    Start Your Trial
                </h2>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200 border border-red-500/50">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-200">
                            Company Name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="Acme Corp"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-200">
                            Work Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="you@company.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-200">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-3 font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
