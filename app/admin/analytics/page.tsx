"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, get } from "firebase/database";

interface AnalyticsData {
    totalUsers: number;
    totalFiles: number;
    totalTenants: number;
    totalStorage: number;
    usersByMonth: { month: string; count: number }[];
    filesByType: { type: string; count: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const db = getFirebaseDatabase();

                const [usersSnap, filesSnap, tenantsSnap] = await Promise.all([
                    get(ref(db, "users")),
                    get(ref(db, "files")),
                    get(ref(db, "tenants")),
                ]);

                const users = usersSnap.exists() ? Object.values(usersSnap.val()) as any[] : [];
                const files = filesSnap.exists() ? Object.values(filesSnap.val()) as any[] : [];
                const tenants = tenantsSnap.exists() ? Object.keys(tenantsSnap.val()).length : 0;

                const totalStorage = files.reduce((sum: number, f: any) => sum + (f.size || 0), 0);

                // Group users by registration month
                const monthCounts: Record<string, number> = {};
                users.forEach((u: any) => {
                    const date = new Date(u.created_at || Date.now());
                    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    monthCounts[key] = (monthCounts[key] || 0) + 1;
                });
                const usersByMonth = Object.entries(monthCounts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-6)
                    .map(([month, count]) => ({ month, count }));

                // Group files by type
                const typeCounts: Record<string, number> = {};
                files.forEach((f: any) => {
                    const type = (f.mime_type || "unknown").split("/")[0];
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });
                const filesByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

                setData({
                    totalUsers: users.length,
                    totalFiles: files.length,
                    totalTenants: tenants,
                    totalStorage,
                    usersByMonth,
                    filesByType,
                });
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAnalytics();
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const maxUserCount = Math.max(...(data?.usersByMonth.map(m => m.count) || [1]));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Platform usage insights and trends</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Users", value: data?.totalUsers || 0, icon: Icons.Users, color: "blue" },
                    { label: "Total Files", value: data?.totalFiles || 0, icon: Icons.File, color: "green" },
                    { label: "Total Tenants", value: data?.totalTenants || 0, icon: Icons.Users, color: "purple" },
                    { label: "Storage Used", value: formatBytes(data?.totalStorage || 0), icon: Icons.HardDrive, color: "orange" },
                ].map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg bg-${card.color}-50 dark:bg-${card.color}-900/20`}>
                                    <Icon className={`w-5 h-5 text-${card.color}-600`} />
                                </div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{card.label}</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* User Growth Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">User Growth (Last 6 Months)</h3>
                <div className="flex items-end gap-4 h-48">
                    {data?.usersByMonth.map((m) => (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{m.count}</span>
                            <div
                                className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all duration-500"
                                style={{ height: `${Math.max((m.count / maxUserCount) * 100, 5)}%` }}
                            ></div>
                            <span className="text-xs text-slate-500">{m.month}</span>
                        </div>
                    ))}
                    {(!data?.usersByMonth || data.usersByMonth.length === 0) && (
                        <p className="text-slate-500 text-sm w-full text-center">No data available</p>
                    )}
                </div>
            </div>

            {/* Files by Type */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Files by Type</h3>
                <div className="space-y-3">
                    {data?.filesByType.map((ft) => {
                        const total = data.totalFiles || 1;
                        const pct = ((ft.count / total) * 100).toFixed(1);
                        return (
                            <div key={ft.type}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize text-slate-700 dark:text-slate-300">{ft.type}</span>
                                    <span className="text-slate-500">{ft.count} files ({pct}%)</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2 rounded-full"
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
