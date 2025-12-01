"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { PlatformStats } from "@/types/admin";
import StatsWidget from "@/components/admin/stats-widget";
import ActivityFeed from "@/components/admin/activity-feed";

export default function AdminDashboard() {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlatformStats();
    }, []);

    const fetchPlatformStats = async () => {
        try {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch platform stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const storagePercentage = stats ? (stats.total_storage_used / stats.total_storage_limit) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Overview</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Monitor and manage your entire platform from this dashboard
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsWidget
                    title="Total Tenants"
                    value={stats?.total_tenants || 0}
                    subtitle={`${stats?.active_tenants || 0} active`}
                    icon={Icons.Users}
                    color="blue"
                    trend={stats?.active_tenants ? `${Math.round((stats.active_tenants / stats.total_tenants) * 100)}% active` : undefined}
                />

                <StatsWidget
                    title="Total Users"
                    value={stats?.total_users || 0}
                    subtitle={`${stats?.active_users_today || 0} active today`}
                    icon={Icons.User}
                    color="green"
                    trend={stats?.new_users_today ? `+${stats.new_users_today} today` : undefined}
                />

                <StatsWidget
                    title="Total Files"
                    value={stats?.total_files || 0}
                    subtitle={`${stats?.files_uploaded_today || 0} uploaded today`}
                    icon={Icons.File}
                    color="purple"
                    trend={stats?.files_uploaded_today ? `+${stats.files_uploaded_today} today` : undefined}
                />

                <StatsWidget
                    title="Storage Used"
                    value={formatBytes(stats?.total_storage_used || 0)}
                    subtitle={`${storagePercentage.toFixed(1)}% of total`}
                    icon={Icons.HardDrive}
                    color="orange"
                    trend={`${formatBytes(stats?.total_storage_limit || 0)} total`}
                />
            </div>

            {/* Storage Usage Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Storage Distribution</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600 dark:text-slate-400">Used Storage</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {formatBytes(stats?.total_storage_used || 0)} / {formatBytes(stats?.total_storage_limit || 0)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Health</h3>
                        <div className="flex items-center gap-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">All Systems Operational</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Icons.Database className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium">Database</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Connected</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Icons.HardDrive className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium">Storage Provider</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Available</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Icons.Shield className="w-5 h-5 text-green-600" />
                                <span className="text-sm font-medium">Firebase Auth</span>
                            </div>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Connected</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                    <ActivityFeed />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-lg transition-all flex items-center gap-3">
                        <Icons.Plus className="w-5 h-5" />
                        <span className="font-medium">Create Tenant</span>
                    </button>

                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-lg transition-all flex items-center gap-3">
                        <Icons.UserPlus className="w-5 h-5" />
                        <span className="font-medium">Add Admin</span>
                    </button>

                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-lg transition-all flex items-center gap-3">
                        <Icons.Download className="w-5 h-5" />
                        <span className="font-medium">Export Data</span>
                    </button>

                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-4 rounded-lg transition-all flex items-center gap-3">
                        <Icons.Settings className="w-5 h-5" />
                        <span className="font-medium">System Settings</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
