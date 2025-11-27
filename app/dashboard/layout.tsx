"use client";

import { AuthProvider } from "@/lib/auth/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/lib/auth/firebase-auth";
import { useRouter } from "next/navigation";

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

    const links = [
        { href: "/dashboard", label: "Overview", icon: "📊" },
        { href: "/dashboard/files", label: "Files", icon: "📁" },
        { href: "/dashboard/users", label: "Team", icon: "👥" },
        { href: "/dashboard/audit", label: "Audit Logs", icon: "📜" },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
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
                        <div className="h-full bg-white w-[45%]"></div>
                    </div>
                    <p className="mt-2 text-xs opacity-75">4.5 GB of 10 GB</p>
                </div>
            </div>
        </aside>
    );
}

function Header() {
    const router = useRouter();

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
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                    🔔
                </button>
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
