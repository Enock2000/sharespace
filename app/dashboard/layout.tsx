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
import { Icons } from "@/components/ui/icons";
import NotificationBell from "@/components/ui/notification-bell";
import GlobalSearch from "@/components/ui/global-search";

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
    // 250GB = 250 * 1024 * 1024 * 1024
    const [storageStats, setStorageStats] = useState({ used: 0, total: 268435456000 });

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
                setStorageStats({ used: totalUsed, total: 268435456000 });
            } catch (error) {
                console.error("Failed to fetch storage stats:", error);
            }
        };

        fetchStorage();
    }, [user]);

    const links = [
        { href: "/dashboard", label: "Overview", icon: Icons.BarChart },
        { href: "/dashboard/folders", label: "Folders", icon: Icons.Folder },
        { href: "/dashboard/files", label: "Files", icon: Icons.File },
        { href: "/dashboard/trash", label: "Trash", icon: Icons.Trash },
        { href: "/dashboard/teams", label: "Teams", icon: Icons.Users },
        { href: "/dashboard/chat", label: "Messages", icon: Icons.MessageCircle },
        { href: "/dashboard/users", label: "Members", icon: Icons.User },
        { href: "/dashboard/audit", label: "Audit Logs", icon: Icons.Scroll },
        { href: "/dashboard/billing", label: "Billing", icon: Icons.CreditCard },
    ];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 GB';
        const gb = bytes / 1073741824;
        return gb.toFixed(1) + ' GB';
    };

    const percentage = Math.min(100, (storageStats.used / storageStats.total) * 100);

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col shadow-lg z-10">
            <div className="p-6 flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm">
                    <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Shared Spaces
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium opacity-90">Storage Used</p>
                        <Icons.BarChart className="w-4 h-4 opacity-50" />
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <p className="mt-2 text-xs opacity-75 font-mono">
                        {formatBytes(storageStats.used)} / {formatBytes(storageStats.total)}
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
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                <Icons.Shield className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Secure Workspace</span>
            </div>

            {/* Global Search */}
            <GlobalSearch />

            <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Loading...'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {currentUser?.role || 'Member'}
                        </div>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-md">
                        {currentUser?.first_name?.[0] || 'U'}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Sign Out"
                    >
                        <Icons.Download className="w-5 h-5 rotate-90" />
                    </button>
                </div>
            </div>
        </header>
    );
}
