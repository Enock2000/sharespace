"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useState, useEffect } from "react";
import { db } from "@/lib/database/schema";
import { User, File as FileType, AuditLog } from "@/types/database";
import { Icons } from "@/components/ui/icons";

interface DashboardStats {
    totalFiles: number;
    activeUsers: number;
    storageUsed: number;
    recentActivity: AuditLog[];
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalFiles: 0,
        activeUsers: 0,
        storageUsed: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                // Get current user to find tenant
                const currentUser = await db.get<User>(`users/${user.uid}`);
                if (!currentUser) return;

                // Fetch all files for this tenant
                const filesMap = await db.get<Record<string, FileType>>(`files`);
                const tenantFiles = filesMap
                    ? Object.values(filesMap).filter(f => f.tenant_id === currentUser.tenant_id)
                    : [];

                // Calculate total storage
                const totalStorage = tenantFiles.reduce((sum, file) => sum + (file.size || 0), 0);

                // Fetch all users for this tenant
                const usersMap = await db.get<Record<string, User>>(`users`);
                const tenantUsers = usersMap
                    ? Object.values(usersMap).filter(u => u.tenant_id === currentUser.tenant_id)
                    : [];

                // Fetch recent audit logs
                const logsMap = await db.get<Record<string, AuditLog>>(`audit_logs/${currentUser.tenant_id}`);
                const logs = logsMap ? Object.values(logsMap) : [];
                const recentLogs = logs
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 5);

                setStats({
                    totalFiles: tenantFiles.length,
                    activeUsers: tenantUsers.length,
                    storageUsed: totalStorage,
                    recentActivity: recentLogs,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    };

    const getActionIcon = (action: string) => {
        if (action.includes('upload')) return <Icons.Upload className="w-5 h-5" />;
        if (action.includes('create')) return <Icons.Folder className="w-5 h-5" />;
        if (action.includes('invite')) return <Icons.Users className="w-5 h-5" />;
        if (action.includes('delete')) return <Icons.Trash className="w-5 h-5" />;
        return <Icons.File className="w-5 h-5" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Files</h3>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Icons.File className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.totalFiles.toLocaleString()}
                    </p>
                    <span className="text-blue-500 text-sm font-medium mt-2 inline-block">
                        All uploaded files
                    </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Team Members</h3>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <Icons.Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.activeUsers}
                    </p>
                    <span className="text-green-500 text-sm font-medium mt-2 inline-block">
                        Active users
                    </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Storage Used</h3>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Icons.BarChart className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatBytes(stats.storageUsed)}
                    </p>
                    <span className="text-slate-500 text-sm font-medium mt-2 inline-block">
                        Across all files
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                </div>
                <div className="p-6">
                    {stats.recentActivity.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>No recent activity</p>
                            <p className="text-sm mt-2">Start by uploading files or inviting team members</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentActivity.map((log) => (
                                <div key={log.id} className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                            {log.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatTimestamp(log.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
