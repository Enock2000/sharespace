"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { User } from "@/types/database";
import Link from "next/link";

export default function UserDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editRole, setEditRole] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserDetails();
    }, [params.id]);

    const fetchUserDetails = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            const found = (data.users || []).find((u: User) => u.id === params.id);
            if (found) {
                setUser(found);
                setEditRole(found.role);
            } else {
                setError("User not found");
            }
        } catch (err) {
            console.error("Failed to fetch user:", err);
            setError("Failed to load user details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!user || !editRole) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, role: editRole }),
            });

            if (res.ok) {
                setIsEditing(false);
                await fetchUserDetails();
            } else {
                alert("Failed to update user role");
            }
        } catch (err) {
            console.error("Error updating role:", err);
            alert("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!user || !confirm(`Are you sure you want to ${user.is_active ? "deactivate" : "reactivate"} this user?`)) return;
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, deactivate: user.is_active }),
            });

            if (res.ok) {
                await fetchUserDetails();
            } else {
                alert("Failed to update user status");
            }
        } catch (err) {
            console.error("Error:", err);
            alert("An error occurred");
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="text-center py-16">
                <Icons.AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {error || "User not found"}
                </h3>
                <Link href="/admin/users" className="text-purple-600 hover:underline">
                    Back to Users
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/users"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {user.first_name} {user.last_name}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">{user.email}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditRole(user.role);
                                }}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateRole}
                                disabled={saving}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Icons.Save className="w-4 h-4" />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                                <Icons.Edit className="w-4 h-4" />
                                Edit Role
                            </button>
                            <button
                                onClick={handleDeactivate}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                    user.is_active
                                        ? "bg-orange-600 text-white hover:bg-orange-700"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                            >
                                <Icons.Ban className="w-4 h-4" />
                                {user.is_active ? "Deactivate" : "Activate"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - User Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* User Information */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            User Information
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">First Name</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">
                                    {user.first_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Last Name</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">
                                    {user.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">
                                    {user.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Role</p>
                                {isEditing ? (
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                        <option value="owner">Owner</option>
                                        <option value="platform_admin">Platform Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                ) : (
                                    <span
                                        className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${
                                            user.role === "super_admin" || user.role === "platform_admin"
                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                : user.role === "owner"
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : user.role === "admin"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400"
                                        }`}
                                    >
                                        {user.role.replace("_", " ")}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
                                {user.is_active ? (
                                    <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">2FA Enabled</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white">
                                    {user.is_2fa_enabled ? "Yes" : "No"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Account Timeline
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <Icons.Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Created</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {formatDate(user.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Icons.Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Last Updated</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {formatDate(user.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Tenant Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Tenant
                        </h3>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tenant ID</p>
                            <p className="font-mono text-sm text-slate-900 dark:text-white break-all">
                                {user.tenant_id}
                            </p>
                            {user.tenant_id !== "platform" && (
                                <Link
                                    href={`/admin/tenants`}
                                    className="mt-3 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    View Tenant
                                    <Icons.ChevronRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Quick Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 rounded-lg transition-colors flex items-center gap-3"
                            >
                                <Icons.Edit className="w-4 h-4" />
                                Edit User Role
                            </button>
                            <button
                                onClick={handleDeactivate}
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 rounded-lg transition-colors flex items-center gap-3"
                            >
                                <Icons.Ban className="w-4 h-4" />
                                {user.is_active ? "Deactivate User" : "Activate User"}
                            </button>
                        </div>
                    </div>

                    {/* Gender Info */}
                    {user.gender && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Additional Info
                            </h3>
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Gender</p>
                                <p className="text-lg font-medium text-slate-900 dark:text-white capitalize">
                                    {user.gender.replace("_", " ")}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
