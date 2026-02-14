"use client";

import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export default function DashboardNotFound() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-center space-y-6 max-w-md">
                <div className="relative w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-slate-400 dark:text-slate-500">404</span>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Resource not found</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        The file, folder, or page you are looking for does not exist within your dashboard.
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/dashboard"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Icons.Home className="w-4 h-4" />
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
