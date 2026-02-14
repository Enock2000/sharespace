"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/ui/icons";

interface PlatformSettings {
    free_trial_days: number;
    default_user_limit: number;
    default_storage_quota: number;
    pricing: {
        free: {
            price: number;
            storage_gb: number;
            user_limit: number;
            features: string[];
        };
        basic: {
            price: number;
            storage_gb: number;
            user_limit: number;
            features: string[];
        };
        pro: {
            price: number;
            storage_gb: number;
            user_limit: number;
            features: string[];
        };
        enterprise: {
            price: number;
            storage_gb: number;
            user_limit: number;
            features: string[];
        };
    };
    email_templates: {
        welcome: string;
        trial_ending: string;
        suspended: string;
    };
    security: {
        session_timeout_minutes: number;
        require_2fa_for_admins: boolean;
        max_login_attempts: number;
    };
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<PlatformSettings>({
        free_trial_days: 14,
        default_user_limit: 50,
        default_storage_quota: 250 * 1024 * 1024 * 1024, // 250GB
        pricing: {
            free: {
                price: 0,
                storage_gb: 10,
                user_limit: 5,
                features: ["Basic file storage", "5 users", "10GB storage"],
            },
            basic: {
                price: 9.99,
                storage_gb: 100,
                user_limit: 25,
                features: ["Everything in Free", "25 users", "100GB storage", "Email support"],
            },
            pro: {
                price: 29.99,
                storage_gb: 500,
                user_limit: 100,
                features: ["Everything in Basic", "100 users", "500GB storage", "Priority support", "Advanced analytics"],
            },
            enterprise: {
                price: 99.99,
                storage_gb: 2000,
                user_limit: 99999,
                features: ["Everything in Pro", "Unlimited users", "2TB storage", "24/7 support", "Custom integrations", "SLA guarantee"],
            },
        },
        email_templates: {
            welcome: "Welcome to Shared Spaces! Your account is ready.",
            trial_ending: "Your free trial ends in {days} days.",
            suspended: "Your account has been suspended. Please contact support.",
        },
        security: {
            session_timeout_minutes: 60,
            require_2fa_for_admins: false,
            max_login_attempts: 5,
        },
    });

    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "pricing" | "email" | "security">("general");

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                alert("Settings saved successfully!");
            } else {
                alert("Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const updatePricing = (plan: keyof typeof settings.pricing, field: string, value: any) => {
        setSettings({
            ...settings,
            pricing: {
                ...settings.pricing,
                [plan]: {
                    ...settings.pricing[plan],
                    [field]: value,
                },
            },
        });
    };

    const tabs = [
        { id: "general", label: "General Settings", icon: Icons.Settings },
        { id: "pricing", label: "Pricing Plans", icon: Icons.DollarSign },
        { id: "email", label: "Email Templates", icon: Icons.Mail },
        { id: "security", label: "Security", icon: Icons.Shield },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                        Configure platform-wide settings and pricing
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Icons.Save className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* General Settings Tab */}
            {activeTab === "general" && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Trial & Defaults</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Free Trial Duration (Days)
                                </label>
                                <input
                                    type="number"
                                    value={settings.free_trial_days}
                                    onChange={(e) => setSettings({ ...settings, free_trial_days: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Number of days new tenants get for free trial</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Default User Limit
                                </label>
                                <input
                                    type="number"
                                    value={settings.default_user_limit}
                                    onChange={(e) => setSettings({ ...settings, default_user_limit: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Default number of users allowed per tenant</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Default Storage Quota (GB)
                                </label>
                                <input
                                    type="number"
                                    value={settings.default_storage_quota / (1024 * 1024 * 1024)}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        default_storage_quota: parseInt(e.target.value) * 1024 * 1024 * 1024
                                    })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Default storage quota for new tenants</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Tab */}
            {activeTab === "pricing" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(settings.pricing).map(([plan, config]) => (
                        <div key={plan} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{plan} Plan</h3>
                                <span className="text-2xl font-bold text-purple-600">${config.price}</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Price ($/month)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={config.price}
                                        onChange={(e) => updatePricing(plan as any, "price", parseFloat(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        Storage (GB)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.storage_gb}
                                        onChange={(e) => updatePricing(plan as any, "storage_gb", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        User Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={config.user_limit}
                                        onChange={(e) => updatePricing(plan as any, "user_limit", parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                        Features
                                    </label>
                                    <div className="space-y-1">
                                        {config.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Icons.CheckCircle className="w-3 h-3 text-green-600" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Email Templates Tab */}
            {activeTab === "email" && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Email Templates</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Welcome Email
                                </label>
                                <textarea
                                    value={settings.email_templates.welcome}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        email_templates: { ...settings.email_templates, welcome: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Trial Ending Email
                                </label>
                                <textarea
                                    value={settings.email_templates.trial_ending}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        email_templates: { ...settings.email_templates, trial_ending: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Use {"{days}"} as placeholder for remaining days</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Account Suspended Email
                                </label>
                                <textarea
                                    value={settings.email_templates.suspended}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        email_templates: { ...settings.email_templates, suspended: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Security Settings</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Session Timeout (Minutes)
                                </label>
                                <input
                                    type="number"
                                    value={settings.security.session_timeout_minutes}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        security: { ...settings.security, session_timeout_minutes: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Max Login Attempts
                                </label>
                                <input
                                    type="number"
                                    value={settings.security.max_login_attempts}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        security: { ...settings.security, max_login_attempts: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Require 2FA for Admins</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Force all platform admins to enable two-factor authentication</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.security.require_2fa_for_admins}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            security: { ...settings.security, require_2fa_for_admins: e.target.checked }
                                        })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
