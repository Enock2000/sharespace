"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Icons } from "@/components/ui/icons";
import { Notification } from "@/types/database";
import Link from "next/link";

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications?userId=${user.uid}&limit=10`);
            const data = await res.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (notificationId?: string) => {
        if (!user) return;
        try {
            const url = notificationId
                ? `/api/notifications?userId=${user.uid}&id=${notificationId}`
                : `/api/notifications?userId=${user.uid}&markAllRead=true`;

            await fetch(url, { method: "PATCH" });

            if (notificationId) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const getNotificationIcon = (type: Notification["type"]) => {
        switch (type) {
            case "file_shared": return Icons.Share2;
            case "comment_added": return Icons.MessageCircle;
            case "mention": return Icons.User;
            case "file_updated": return Icons.File;
            case "storage_warning": return Icons.AlertTriangle;
            case "invitation": return Icons.UserPlus;
            case "file_request": return Icons.Upload;
            default: return Icons.Bell;
        }
    };

    const getNotificationColor = (type: Notification["type"]) => {
        switch (type) {
            case "file_shared": return "bg-blue-100 text-blue-600";
            case "comment_added": return "bg-purple-100 text-purple-600";
            case "mention": return "bg-green-100 text-green-600";
            case "file_updated": return "bg-indigo-100 text-indigo-600";
            case "storage_warning": return "bg-amber-100 text-amber-600";
            case "invitation": return "bg-pink-100 text-pink-600";
            case "file_request": return "bg-teal-100 text-teal-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative"
            >
                <Icons.Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => handleMarkAsRead()}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Icons.Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const IconComponent = getNotificationIcon(notification.type);
                                const colorClass = getNotificationColor(notification.type);

                                return (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${!notification.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                            }`}
                                        onClick={() => {
                                            if (!notification.is_read) {
                                                handleMarkAsRead(notification.id);
                                            }
                                            if (notification.action_url) {
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        {notification.action_url ? (
                                            <Link href={notification.action_url} className="flex gap-3">
                                                <NotificationContent
                                                    notification={notification}
                                                    IconComponent={IconComponent}
                                                    colorClass={colorClass}
                                                    formatTime={formatTime}
                                                />
                                            </Link>
                                        ) : (
                                            <div className="flex gap-3">
                                                <NotificationContent
                                                    notification={notification}
                                                    IconComponent={IconComponent}
                                                    colorClass={colorClass}
                                                    formatTime={formatTime}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                            <Link
                                href="/dashboard/notifications"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium block text-center"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function NotificationContent({
    notification,
    IconComponent,
    colorClass,
    formatTime
}: {
    notification: Notification;
    IconComponent: any;
    colorClass: string;
    formatTime: (timestamp: number) => string;
}) {
    return (
        <>
            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {notification.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {formatTime(notification.created_at)}
                </p>
            </div>
            {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
        </>
    );
}
