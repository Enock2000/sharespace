"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { Tenant } from "@/types/database";
import { TenantStats } from "@/types/admin";
import Link from "next/link";
import TenantCard from "@/components/admin/tenant-card";

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [tenantStats, setTenantStats] = useState<Map<string, TenantStats>>(new Map());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all");

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await fetch("/api/admin/tenants");
            const data = await res.json();
            setTenants(data.tenants || []);

            // Fetch stats for each tenant
            const statsMap = new Map<string, TenantStats>();
            for (const tenant of data.tenants || []) {
                const statsRes = await fetch(`/api/admin/tenants/${tenant.id}/stats`);
                const statsData = await statsRes.json();
                statsMap.set(tenant.id, statsData);
            }
            setTenantStats(statsMap);
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter((tenant) => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" ||
            (filterStatus === "active" && !tenant.is_suspended) ||
            (filterStatus === "suspended" && tenant.is_suspended);
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tenant Management</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Manage all platform tenants and their configurations
                    </p>
                </div>

                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
                    <Icons.Plus className="w-5 h-5" />
                    Create Tenant
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Icons.Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Total Tenants</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Icons.CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {tenants.filter(t => !t.is_suspended).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Icons.Ban className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Suspended</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {tenants.filter(t => t.is_suspended).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tenants by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "all"
                                ? "bg-purple-600 text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus("active")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "active"
                                ? "bg-purple-600 text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilterStatus("suspended")}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "suspended"
                                ? "bg-purple-600 text-white"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                    >
                        Suspended
                    </button>
                </div>
            </div>

            {/* Tenants Grid */}
            {filteredTenants.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <Icons.Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No tenants found</h3>
                    <p className="text-slate-600 dark:text-slate-400">
                        {searchTerm ? "Try adjusting your search criteria" : "Create your first tenant to get started"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTenants.map((tenant) => (
                        <TenantCard
                            key={tenant.id}
                            tenant={tenant}
                            stats={tenantStats.get(tenant.id)}
                            onRefresh={fetchTenants}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
