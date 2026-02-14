import Link from "next/link";
import { Icons } from "@/components/ui/icons";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="relative w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <h1 className="text-4xl font-bold text-slate-300 dark:text-slate-600">404</h1>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page not found</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Icons.LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
