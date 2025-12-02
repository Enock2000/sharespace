"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/ui/icons";
import { isPlatformAdmin } from "@/lib/auth/admin-middleware";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkAdminAccess() {
            try {
                // If on login page, skip the check
                if (pathname === "/admin/login") {
                    if (mounted) setLoading(false);
                    return;
                }

                // Wait for auth to initialize
                if (authLoading) {
                    return;
                }

                if (!user) {
                    if (mounted) {
                        setLoading(false);
                        router.push("/admin/login");
                    }
                    return;
                }

                // Add timeout to prevent infinite loading
                const timeout = setTimeout(() => {
                    if (mounted) {
                        console.error("Admin check timed out");
                        setLoading(false);
                        setIsAdmin(false);
                        router.push("/admin/login");
                    }
                }, 5000);

                const adminStatus = await isPlatformAdmin(user.uid);
                clearTimeout(timeout);

                if (mounted) {
                    setIsAdmin(adminStatus);
                    setLoading(false);

                    if (!adminStatus) {
                        router.push("/admin/login");
                    }
                }
            } catch (error) {
                console.error("Admin check error:", error);
                if (mounted) {
                    setLoading(false);
                    setIsAdmin(false);
                    router.push("/admin/login");
                }
            }
        }

        checkAdminAccess();

        return () => {
            mounted = false;
        };
    }, [user, authLoading, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Allow login page to render even if not admin
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    if (!isAdmin) {
        return null;
    }

    const navLinks = [
        { href: "/admin", label: "Dashboard", icon: Icons.BarChart },
        { href: "/admin/tenants", label: "Tenants", icon: Icons.Users },
        { href: "/admin/users", label: "Users", icon: Icons.User },
        { href: "/admin/files", label: "Files", icon: Icons.File },
        { href: "/admin/analytics", label: "Analytics", icon: Icons.TrendingUp },
        { href: "/admin/monitoring", label: "Monitoring", icon: Icons.Activity },
        { href: "/admin/audit", label: "Audit Logs", icon: Icons.Scroll },
        { href: "/admin/security", label: "Security", icon: Icons.Shield },
        { href: "/admin/settings", label: "Settings", icon: Icons.Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Admin Header */}
            <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg sticky top-0 z-50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Icons.Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Platform Admin</h1>
                            <p className="text-xs text-white/80">Super Administrator Portal</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium backdrop-blur-sm flex items-center gap-2"
                        >
                            <Icons.Home className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium">{user?.email}</p>
                                <p className="text-xs text-white/70">Platform Admin</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold backdrop-blur-sm">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-slate-800 min-h-[calc(100vh-80px)] border-r border-slate-200 dark:border-slate-700 sticky top-[80px]">
                    <nav className="p-4 space-y-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-sm font-medium"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
