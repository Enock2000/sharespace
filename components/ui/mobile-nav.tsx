"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    // Close menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 640) setIsOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Prevent scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    return (
        <>
            {/* Mobile actions — visible only on mobile */}
            <div className="flex sm:hidden items-center gap-2">
                <ThemeToggle />
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative z-50 flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    aria-label="Toggle menu"
                >
                    <span className={`block w-5 h-0.5 bg-slate-800 dark:bg-white rounded-full transition-all duration-300 ${isOpen ? "rotate-45 translate-y-[3px]" : ""}`} />
                    <span className={`block w-5 h-0.5 bg-slate-800 dark:bg-white rounded-full transition-all duration-300 mt-1 ${isOpen ? "opacity-0 scale-0" : ""}`} />
                    <span className={`block w-5 h-0.5 bg-slate-800 dark:bg-white rounded-full transition-all duration-300 mt-1 ${isOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                </button>
            </div>

            {/* Mobile menu overlay */}
            <div
                className={`sm:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "visible opacity-100" : "invisible opacity-0"
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />

                {/* Menu panel */}
                <div
                    className={`absolute top-0 right-0 w-[280px] h-full bg-white/95 dark:bg-[#0d0d24]/95 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    <div className="flex flex-col h-full pt-20 px-6">
                        {/* Navigation links */}
                        <nav className="flex flex-col gap-1 mb-8">
                            <Link
                                href="#features"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <span className="text-lg">✨</span>
                                Features
                            </Link>
                            <Link
                                href="#how-it-works"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <span className="text-lg">🚀</span>
                                How It Works
                            </Link>
                            <Link
                                href="/pricing"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <span className="text-lg">💎</span>
                                Pricing
                            </Link>
                        </nav>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent mb-6" />

                        {/* Auth buttons */}
                        <div className="flex flex-col gap-3">
                            <Link href="/login" onClick={() => setIsOpen(false)}>
                                <button className="w-full px-6 py-3 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-medium">
                                    Sign In
                                </button>
                            </Link>
                            <Link href="/register" onClick={() => setIsOpen(false)}>
                                <button className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 transition-all">
                                    Get Started Free
                                </button>
                            </Link>
                        </div>

                        {/* Bottom branding */}
                        <div className="mt-auto pb-8">
                            <p className="text-[11px] text-slate-400 dark:text-slate-600 text-center">
                                © {new Date().getFullYear()} Shared Spaces
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
