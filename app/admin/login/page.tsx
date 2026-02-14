"use client";

import { useState, useEffect } from "react";
import { loginUser, logoutUser } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth/auth-context";
import { isPlatformAdmin } from "@/lib/auth/admin-middleware";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    // Check if user is already logged in and is an admin
    useEffect(() => {
        let mounted = true;

        async function checkExistingAuth() {
            try {
                if (user) {
                    console.log("Checking admin status for user:", user.uid);
                    // Add a timeout to prevent infinite loading
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Auth check timed out")), 5000)
                    );

                    const checkPromise = isPlatformAdmin(user.uid);
                    const isAdmin = await Promise.race([checkPromise, timeoutPromise]);

                    if (mounted) {
                        if (isAdmin) {
                            console.log("User is admin, redirecting...");
                            router.push("/admin");
                        } else {
                            console.log("User is not admin");
                            setCheckingAuth(false);
                        }
                    }
                } else {
                    if (mounted) setCheckingAuth(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                if (mounted) setCheckingAuth(false);
            }
        }

        checkExistingAuth();

        return () => { mounted = false; };
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await loginUser(email, password);

            if (result.user) {
                // Fetch user role from database
                const { getFirebaseDatabase } = await import("@/lib/firebase-config");
                const { ref, get } = await import("firebase/database");

                const db = getFirebaseDatabase();
                const userRef = ref(db, `users/${result.user.uid}`);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const userRole = userData.role;

                    // Strictly enforce admin role
                    if (userRole === "platform_admin" || userRole === "super_admin") {
                        console.log("Admin access granted, redirecting to /admin");
                        router.push("/admin");
                    } else {
                        // Sign out immediately if not an admin
                        await logoutUser();
                        setError("Access denied. This portal is for platform administrators only.");
                    }
                } else {
                    await logoutUser();
                    setError("User data not found. Please contact support.");
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    // Show loading screen while checking auth
    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="w-auto h-12 rounded-xl flex items-center justify-center overflow-hidden">
                            <Icons.Logo className="w-full h-full object-contain" />
                        </div>
                        <span className="text-3xl font-bold text-gradient">Platform Admin</span>
                    </div>
                    <p className="text-gray-400 mt-2">Administrator Access Portal</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Icons.Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Admin Sign In</h2>
                            <p className="text-sm text-gray-400">Authorized personnel only</p>
                        </div>
                    </div>

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
                                Admin Email
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
                                    placeholder="admin@company.com"
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <Icons.Shield className="w-5 h-5" />
                                    <span>Admin Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400">
                        <Link href="/" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </div>

                {/* Security notice */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300">
                        <Icons.Shield className="w-4 h-4" />
                        <span>Secure Admin Portal - All access is logged</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
