"use client";

import { useTheme } from "@/lib/utils/theme-context";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        if (theme === "dark") setTheme("light");
        else if (theme === "light") setTheme("system");
        else setTheme("dark");
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            aria-label="Toggle theme"
            title={theme === "dark" ? "Dark mode" : theme === "light" ? "Light mode" : "System"}
        >
            {/* Sun icon */}
            <svg
                className="w-4 h-4 text-amber-500 transition-all duration-300 dark:opacity-0 dark:scale-75 dark:rotate-90 opacity-100 scale-100 rotate-0 absolute"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>

            {/* Moon icon */}
            <svg
                className="w-4 h-4 text-indigo-300 transition-all duration-300 dark:opacity-100 dark:scale-100 dark:rotate-0 opacity-0 scale-75 -rotate-90 absolute"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        </button>
    );
}
