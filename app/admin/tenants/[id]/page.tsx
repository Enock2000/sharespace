"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { Tenant, User, File, Folder } from "@/types/database";
import { TenantStats } from "@/types/admin";
import Link from "next/link";

export default function TenantDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        plan: "free" as "free" | "basic" | "pro" | "enterprise",
        storage_quota: 0,
        user_limit: 0,
        trial_days_remaining: 0,
    });

    useEffect(() => {
        fetchTenantDetails();
    }, [params.id]);

    const fetchTenantDetails = async () => {
        try {
            const [tenantRes, statsRes, usersRes] = await Promise.all([
                fetch(`/api/admin/tenants/${params.id}`),
                fetch(`/api/admin/tenants/${params.id}/stats`),
                fetch(`/api/admin/users?tenant=${params.id}`),
            ]);

            const tenantData = await tenantRes.json();
            const statsData = await statsRes.json();
            const usersData = await usersRes.json();

            setTenant(tenantData.tenant);
            setStats(statsData);
            setUsers(usersData.users || []);

            // Initialize edit form
            if (tenantData.tenant) {
                setEditForm({
                    name: tenantData.tenant.name,
                    plan: tenantData.tenant.plan,
                    storage_quota: tenantData.tenant.storage_quota / (1024 * 1024 * 1024), // Convert to GB
                    user_limit: tenantData.tenant.user_limit,
                    trial_days_remaining: calculateTrialDaysRemaining(tenantData.tenant.created_at),
                });
            }
        } catch (error) {
            console.error("Failed to fetch tenant details:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTrialDaysRemaining = (createdAt: number) => {
        const TRIAL_DAYS = 14; // Should come from platform settings
        const daysSinceCreation = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
        return Math.max(0, TRIAL_DAYS - daysSinceCreation);
    };

    const handleSuspend = async () => {
        if (!tenant || !confirm(`Are you sure you want to ${tenant.is_suspended ? 'activate' : 'suspend'} this tenant?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/tenants/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_suspended: !tenant.is_suspended }),
            });

            if (res.ok) {
                fetchTenantDetails();
            } else {
                alert("Failed to update tenant");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to DELETE this tenant? This action cannot be undone!")) {
            return;
        }

        const confirmText = prompt("Type 'DELETE' to confirm:");
        if (confirmText !== "DELETE") {
            return;
        }

        try {
            const res = await fetch(`/api/admin/tenants/${params.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                alert("Tenant deleted successfully");
                router.push("/admin/tenants");
            } else {
                alert("Failed to delete tenant");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred");
        }
    };

    const handleSaveChanges = async () => {
        try {
            const res = await fetch(`/api/admin/tenants/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editForm.name,
                    plan: editForm.plan,
                    storage_quota: editForm.storage_quota * 1024 * 1024 * 1024, // Convert GB to bytes
                    user_limit: editForm.user_limit,
                }),
            });

            if (res.ok) {
                setIsEditing(false);
                fetchTenantDetails();
                alert("Tenant updated successfully");
            } else {
                alert("Failed to update tenant");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred");
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-16">
                <Icons.AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Tenant not found</h3>
                <Link href="/admin/tenants" className="text-purple-600 hover:underline">
                    Back to Tenants
                </Link>
            </div>
        );
    }

    const storagePercentage = stats ? (stats.storage_used / stats.storage_limit) * 100 : 0;
    const userPercentage = (tenant.user_limit > 0) ? (stats?.total_users || 0) / tenant.user_limit * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/tenants" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tenant.name}</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Tenant ID: {tenant.id}</p>
                    </div>
                    {tenant.is_suspended && (
                        <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                            Suspended
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                            >
                                <Icons.Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                                <Icons.Edit className="w-4 h-4" />
                                Edit
                            </button>
                            <button
                                onClick={handleSuspend}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${tenant.is_suspended
                                        ? "bg-green-600 text-white hover:bg-green-700"
                                        : "bg-orange-600 text-white hover:bg-orange-700"
                                    }`}
                            >
                                <Icons.Ban className="w-4 h-4" />
                                {tenant.is_suspended ? 'Activate' : 'Suspend'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <Icons.Trash className="w-4 h-4" />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tenant Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tenant Information</h3>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tenant Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Plan
                                    </label>
                                    <select
                                        value={editForm.plan}
                                        onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="free">Free</option>
                                        <option value="basic">Basic</option>
                                        <option value="pro">Pro</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Storage Quota (GB)
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.storage_quota}
                                        onChange={(e) => setEditForm({ ...editForm, storage_quota: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        User Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={editForm.user_limit}
                                        onChange={(e) => setEditForm({ ...editForm, user_limit: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Plan</p>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white capitalize">{tenant.plan}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Created</p>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                                        {new Date(tenant.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Storage Quota</p>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                                        {formatBytes(tenant.storage_quota)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">User Limit</p>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                                        {tenant.user_limit}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Trial Days Remaining</p>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                                        {editForm.trial_days_remaining} days
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                                    <p className="text-lg font-medium text-slate-900 dark:text-white">
                                        {tenant.is_suspended ? 'Suspended' : 'Active'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Usage Statistics */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Usage Statistics</h3>

                        <div className="space-y-6">
                            {/* Storage Usage */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Storage Used</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {formatBytes(stats?.storage_used || 0)} / {formatBytes(stats?.storage_limit || 0)}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{storagePercentage.toFixed(1)}% used</p>
                            </div>

                            {/* User Usage */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400">Users</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {stats?.total_users || 0} / {tenant.user_limit}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(userPercentage, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{userPercentage.toFixed(1)}% used</p>
                            </div>

                            {/* Files & Folders */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="text-2xl font-bold text-purple-600">{stats?.total_files || 0}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Files</p>
                                </div>
                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="text-2xl font-bold text-indigo-600">{stats?.total_folders || 0}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Folders</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Users */}
                <div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Users ({users.length})
                        </h3>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                                >
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                                        {user.first_name[0]}{user.last_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{user.email}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded capitalize">
                                        {user.role}
                                    </span>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    <Icons.User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No users yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
