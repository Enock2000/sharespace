"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useState, useEffect } from "react";
import { Icons } from "@/components/ui/icons";
import { authFetch } from "@/lib/utils/api-client";
import { NotificationPreferences } from "@/types/database";

export default function SettingsPage() {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            fetchPreferences();
        }
    }, [user]);

    const fetchPreferences = async () => {
        if (!user) return;
        try {
            const res = await authFetch("/api/notifications/preferences", {}, user);
            const data = await res.json();
            if (data.preferences) {
                setPreferences(data.preferences);
            }
        } catch (error) {
            console.error("Failed to fetch preferences:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof NotificationPreferences) => {
        if (!preferences || !user) return;

        const newValue = !preferences[key];
        // Optimistic update
        setPreferences(prev => prev ? { ...prev, [key]: newValue } : null);

        // Debounce or immediate save? Simple immediate save for now.
        try {
            await authFetch("/api/notifications/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: newValue })
            }, user);
        } catch (error) {
            console.error("Failed to update preference:", error);
            // Revert on failure
            setPreferences(prev => prev ? { ...prev, [key]: !newValue } : null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!preferences) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your notification preferences and account settings.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Icons.Bell className="w-5 h-5 text-indigo-500" />
                        Notification Preferences
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">Channels</h3>

                            <Toggle
                                label="Email Notifications"
                                description="Receive updates via email"
                                checked={preferences.email_enabled}
                                onChange={() => handleToggle("email_enabled")}
                            />
                            <Toggle
                                label="Push Notifications"
                                description="Receive mobile push notifications"
                                checked={preferences.push_enabled}
                                onChange={() => handleToggle("push_enabled")}
                            />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white uppercase tracking-wider">Events</h3>

                            <Toggle
                                label="File Shared"
                                description="When someone shares a file with you"
                                checked={preferences.file_shared}
                                onChange={() => handleToggle("file_shared")}
                            />
                            <Toggle
                                label="Comments"
                                description="When someone comments on your file"
                                checked={preferences.comments}
                                onChange={() => handleToggle("comments")}
                            />
                            <Toggle
                                label="Mentions"
                                description="When someone mentions you (@user)"
                                checked={preferences.mentions}
                                onChange={() => handleToggle("mentions")}
                            />
                            <Toggle
                                label="File Updates"
                                description="When a shared file is updated"
                                checked={preferences.file_updates}
                                onChange={() => handleToggle("file_updates")}
                            />
                            <Toggle
                                label="Storage Warnings"
                                description="When you approach storage limits"
                                checked={preferences.storage_warnings}
                                onChange={() => handleToggle("storage_warnings")}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Toggle({ label, description, checked, onChange }: {
    label: string,
    description: string,
    checked: boolean,
    onChange: () => void
}) {
    return (
        <label className="flex items-start justify-between cursor-pointer group">
            <div className="flex-1 mr-4">
                <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    {description}
                </div>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </div>
        </label>
    );
}
