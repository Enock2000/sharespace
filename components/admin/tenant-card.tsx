import { Icons } from "@/components/ui/icons";
import { Tenant } from "@/types/database";
import { TenantStats } from "@/types/admin";
import Link from "next/link";

interface TenantCardProps {
    tenant: Tenant;
    stats?: TenantStats;
    onRefresh: () => void;
}

export default function TenantCard({ tenant, stats, onRefresh }: TenantCardProps) {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const storagePercentage = stats
        ? (stats.storage_used / stats.storage_limit) * 100
        : 0;

    const handleSuspend = async () => {
        if (!confirm(`Are you sure you want to ${tenant.is_suspended ? 'activate' : 'suspend'} this tenant?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_suspended: !tenant.is_suspended }),
            });

            if (res.ok) {
                onRefresh();
            } else {
                alert("Failed to update tenant status");
            }
        } catch (error) {
            console.error("Error updating tenant:", error);
            alert("An error occurred");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tenant.name}</h3>
                        {tenant.is_suspended ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                Suspended
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                Active
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">ID: {tenant.id.substring(0, 16)}...</p>
                </div>

                <div className="flex items-center gap-1">
                    <Link
                        href={`/admin/tenants/${tenant.id}`}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Icons.Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </Link>
                    <button
                        onClick={handleSuspend}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={tenant.is_suspended ? "Activate" : "Suspend"}
                    >
                        <Icons.Ban className="w-4 h-4 text-orange-600" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Icons.Users className="w-4 h-4 text-blue-600" />
                                <p className="text-xs text-slate-600 dark:text-slate-400">Users</p>
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.total_users}</p>
                            <p className="text-xs text-slate-500">{stats.active_users} active</p>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Icons.File className="w-4 h-4 text-purple-600" />
                                <p className="text-xs text-slate-600 dark:text-slate-400">Files</p>
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">{stats.total_files}</p>
                            <p className="text-xs text-slate-500">{stats.total_folders} folders</p>
                        </div>
                    </div>

                    {/* Storage Bar */}
                    <div>
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-600 dark:text-slate-400">Storage Used</span>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {formatBytes(stats.storage_used)} / {formatBytes(stats.storage_limit)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Plan Badge */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600 dark:text-slate-400">Plan</span>
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded capitalize">
                                {tenant.plan}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
