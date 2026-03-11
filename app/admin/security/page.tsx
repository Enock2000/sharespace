"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, get } from "firebase/database";

interface SecurityOverview {
    totalUsers: number;
    admins: { id: string; email: string; role: string }[];
    recentLogins: { email: string; timestamp: number }[];
    twoFactorEnabled: number;
    suspendedUsers: number;
}

export default function SecurityPage() {
    const [data, setData] = useState<SecurityOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSecurity() {
            try {
                const db = getFirebaseDatabase();
                const usersSnap = await get(ref(db, "users"));

                if (!usersSnap.exists()) {
                    setData({ totalUsers: 0, admins: [], recentLogins: [], twoFactorEnabled: 0, suspendedUsers: 0 });
                    setLoading(false);
                    return;
                }

                const users = Object.entries(usersSnap.val()) as [string, any][];

                const admins = users
                    .filter(([, u]) => u.role === "platform_admin" || u.role === "super_admin" || u.role === "admin")
                    .map(([id, u]) => ({ id, email: u.email || "N/A", role: u.role }));

                const recentLogins = users
                    .filter(([, u]) => u.last_active)
                    .map(([, u]) => ({ email: u.email || "unknown", timestamp: u.last_active }))
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 10);

                const twoFactorEnabled = users.filter(([, u]) => u.two_factor_enabled).length;
                const suspendedUsers = users.filter(([, u]) => u.suspended || u.status === "suspended").length;

                setData({
                    totalUsers: users.length,
                    admins,
                    recentLogins,
                    twoFactorEnabled,
                    suspendedUsers,
                });
            } catch (error) {
                console.error("Failed to fetch security data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSecurity();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Security</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Security overview and access management</p>
            </div>

            {/* Security Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Icons.Shield className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Admin Accounts</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.admins.length || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Icons.Lock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">2FA Enabled</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.twoFactorEnabled || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {data?.totalUsers ? ((data.twoFactorEnabled / data.totalUsers) * 100).toFixed(0) : 0}% of users
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Icons.AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Suspended</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.suspendedUsers || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Icons.Users className="w-5 h-5 text-purple-600" />
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{data?.totalUsers || 0}</p>
                </div>
            </div>

            {/* Admin Accounts */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Administrator Accounts</h3>
                {data?.admins.length === 0 ? (
                    <p className="text-slate-500 text-sm">No admin accounts found</p>
                ) : (
                    <div className="space-y-3">
                        {data?.admins.map((admin) => (
                            <div key={admin.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                                        {admin.email[0]?.toUpperCase() || "A"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{admin.email}</p>
                                        <p className="text-xs text-slate-500">{admin.id.slice(0, 16)}...</p>
                                    </div>
                                </div>
                                <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium">
                                    {admin.role.replace(/_/g, " ")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Logins */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent User Activity</h3>
                {data?.recentLogins.length === 0 ? (
                    <p className="text-slate-500 text-sm">No recent activity</p>
                ) : (
                    <div className="space-y-2">
                        {data?.recentLogins.map((login, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <Icons.LogIn className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{login.email}</span>
                                </div>
                                <span className="text-xs text-slate-500">{new Date(login.timestamp).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
