"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";
import { File } from "@/types/database";
import Link from "next/link";

export default function AdminFilesPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTenant, setSelectedTenant] = useState("all");
    const [tenants, setTenants] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchFiles();
        fetchTenants();
    }, [selectedTenant]);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            let url = "/api/admin/files";
            if (selectedTenant !== "all") {
                url += `?tenant=${selectedTenant}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            setFiles(data.files || []);
        } catch (error) {
            console.error("Failed to fetch files:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch("/api/admin/tenants");
            const data = await res.json();
            setTenants(data.tenants || []);
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes("image")) return Icons.Image;
        if (mimeType.includes("pdf")) return Icons.FileText;
        if (mimeType.includes("video")) return Icons.Video;
        return Icons.File;
    };

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.uploaded_by.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Files</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        View and manage files across all tenants
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchFiles}
                        className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                        <Icons.RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search files by name or uploader..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none min-w-[200px]"
                >
                    <option value="all">All Tenants</option>
                    {tenants.map(tenant => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                </select>
            </div>

            {/* Files Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Size</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Type</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Tenant</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Uploaded By</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredFiles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <Icons.File className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No files found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredFiles.map((file) => {
                                    const FileIcon = getFileIcon(file.mime_type);
                                    const tenant = tenants.find(t => t.id === file.tenant_id);

                                    return (
                                        <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                                        <FileIcon className="w-5 h-5" />
                                                    </div>
                                                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {formatBytes(file.size)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                                {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tenant ? (
                                                    <Link
                                                        href={`/admin/tenants/${tenant.id}`}
                                                        className="text-purple-600 hover:underline text-sm font-medium"
                                                    >
                                                        {tenant.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">Unknown</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                                {file.uploaded_by}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="text-slate-400 hover:text-purple-600 transition-colors">
                                                    <Icons.MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
