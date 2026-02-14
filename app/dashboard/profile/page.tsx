"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { authFetch } from "@/lib/utils/api-client";
import { User } from "@/types/database";
import { Icons } from "@/components/ui/icons";
import { resetPassword } from "@/lib/auth/firebase-auth";
import { Skeleton } from "@/components/ui/skeleton";

import { TwoFactorSetupModal } from "@/components/auth/two-factor-setup-modal";

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

    // 2FA Modal state
    const [show2FAModal, setShow2FAModal] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const res = await authFetch(`/api/users/${user.uid}`, {}, user);
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                    setFirstName(data.user.first_name);
                    setLastName(data.user.last_name);
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        if (!user || !profile) return;

        try {
            const res = await authFetch(`/api/users/${user.uid}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName
                })
            }, user);

            if (!res.ok) throw new Error("Failed to update profile");

            const data = await res.json();
            setProfile(data.user);
            setMessage({ type: "success", text: "Profile updated successfully" });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to update profile. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        try {
            await resetPassword(user.email);
            setMessage({ type: "success", text: "Password reset email sent. Check your inbox." });
        } catch (error) {
            setMessage({ type: "error", text: "Failed to send reset email." });
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <Skeleton variant="text" className="h-8 w-48 mb-2" />
                    <Skeleton variant="text" className="h-4 w-64" />
                </header>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                            <Skeleton variant="text" className="h-6 w-40" />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Skeleton variant="text" className="h-4 w-20" />
                                    <Skeleton variant="rectangular" className="h-10 w-full rounded-lg" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton variant="text" className="h-4 w-20" />
                                    <Skeleton variant="rectangular" className="h-10 w-full rounded-lg" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton variant="text" className="h-4 w-24" />
                                <Skeleton variant="rectangular" className="h-10 w-full rounded-lg" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center">
                            <Skeleton variant="circular" className="h-24 w-24 mb-4" />
                            <Skeleton variant="text" className="h-6 w-32 mb-2" />
                            <Skeleton variant="text" className="h-4 w-20" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account settings and preferences.</p>
            </header>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900"
                    : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900"
                    }`}>
                    {message.type === "success" ? (
                        <Icons.CheckCircle className="w-5 h-5" />
                    ) : (
                        <Icons.AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            <div className="grid gap-8 md:grid-cols-3">
                {/* Profile Card */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Email cannot be changed contact support for help.</p>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">Password</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Change your account password securely.</p>
                                </div>
                                <button
                                    onClick={handlePasswordReset}
                                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                                >
                                    Reset Password
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                                    </div>
                                    {profile.is_2fa_enabled ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            Enabled
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => setShow2FAModal(true)}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
                                        >
                                            Enable 2FA
                                        </button>
                                    )}
                                </div>
                                <TwoFactorSetupModal
                                    isOpen={show2FAModal}
                                    onClose={() => setShow2FAModal(false)}
                                    onSuccess={() => {
                                        setProfile(prev => prev ? ({ ...prev, is_2fa_enabled: true }) : null);
                                        setShow2FAModal(false);
                                        setMessage({ type: "success", text: "Two-Factor Authentication enabled successfully!" });
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                                {profile.first_name[0]}{profile.last_name[0]}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {firstName} {lastName}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{profile.role}</p>

                            <div className="w-full mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">0</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Files</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">0GB</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Used</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Need Help?</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                            Contact your workspace administrator for help with permissions or account access.
                        </p>
                        <a href="mailto:support@sharespace.com" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Contact Support →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
