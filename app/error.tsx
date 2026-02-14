"use client";

import { useEffect } from "react";
import { Icons } from "@/components/ui/icons";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                    <Icons.AlertTriangle className="w-8 h-8" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong!</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        We encountered an unexpected error. Please try again or contact support if the issue persists.
                    </p>
                    {error.digest && (
                        <p className="mt-2 text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                            Error ID: {error.digest}
                        </p>
                    )}
                </div>

                <button
                    onClick={reset}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                    <Icons.RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        </div>
    );
}
