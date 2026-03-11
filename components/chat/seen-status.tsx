"use client";

import { Icons } from "@/components/ui/icons";

type SeenState = "sending" | "sent" | "delivered" | "seen";

interface SeenStatusProps {
    status: SeenState;
    seenByAvatar?: string; // initials for mini-avatar
    className?: string;
}

export function SeenStatus({ status, seenByAvatar, className = "" }: SeenStatusProps) {
    if (status === "sending") {
        return (
            <span className={`inline-flex items-center text-slate-400 ${className}`}>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
            </span>
        );
    }

    if (status === "sent") {
        return (
            <span className={`inline-flex items-center text-slate-400 ${className}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5L20 7" />
                </svg>
            </span>
        );
    }

    if (status === "delivered") {
        return (
            <span className={`inline-flex items-center text-slate-400 ${className}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12l5 5L17 7" />
                    <path d="M7 12l5 5L22 7" />
                </svg>
            </span>
        );
    }

    // Seen - blue double check or mini avatar
    if (seenByAvatar) {
        return (
            <span className={`inline-flex items-center ${className}`}>
                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[7px] font-bold">
                    {seenByAvatar}
                </span>
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center text-blue-500 ${className}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12l5 5L17 7" />
                <path d="M7 12l5 5L22 7" />
            </svg>
        </span>
    );
}
