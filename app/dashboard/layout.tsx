"use client";

import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { db } from "@/lib/database/schema";
import { User, File as FileType } from "@/types/database";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </AuthProvider>
    );
}

function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [storageStats, setStorageStats] = useState({ used: 0, total: 10737418240 }); // 10GB default

    useEffect(() => {
        const fetchStorage = async () => {
            if (!user) return;

            try {
                const currentUser = await db.get<User>(`users/${user.uid}`);
                if (!currentUser) return;

                const filesMap = await db.get<Record<string, FileType>>(`files`);
                const tenantFiles = filesMap
                    ? Object.values(filesMap).filter(f => f.tenant_id === currentUser.tenant_id)
                    : [];

                const totalUsed = tenantFiles.reduce((sum, file) => sum + (file.size || 0), 0);
                setStorageStats({ used: totalUsed, total: 10737418240 }); // 10GB
            } catch (error) {
                console.error("Failed to fetch storage stats:", error);
            }
        };

        fetchStorage();
    }, [user]);

    const links = [
        { href: "/dashboard", label: "Overview", icon: "📊" },
        { href: "/dashboard/folders", label: "Folders", icon: "📁" },
        { href: "/dashboard/files", label: "Files", icon: "📄" },
        { href: "/dashboard/users", label: "Team", icon: "👥" },
        { href: "/dashboard/audit", label: "Audit Logs", icon: "📜" },
    ];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 GB';
        const gb = bytes / 1073741824;
        return gb.toFixed(1) + ' GB';
    };

    const percentage = Math.min(100, (storageStats.used / storageStats.total) * 100);

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
            <div className="p-6 flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                    <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                    Shared Spaces
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                        >
                            <span>{link.icon}</span>
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                    <p className="text-sm font-medium opacity-90">Storage Used</p>
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <p className="mt-2 text-xs opacity-75">
                        {formatBytes(storageStats.used)} of {formatBytes(storageStats.total)}
                    </p>
                </div>
            </div>
        </aside>
    );
}

function Header() {
    const router = useRouter();
    const { user } = useAuth();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            if (!user) return;
            const userData = await db.get<User>(`users/${user.uid}`);
            setCurrentUser(userData);
        };
        loadUser();
    }, [user]);

    const handleLogout = async () => {
        await logoutUser();
        router.push("/login");
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                Dashboard
            </h2>

            <div className="flex items-center gap-4">
                {currentUser && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        {currentUser.email}
                    </div>
                )}
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
}
