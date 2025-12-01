// Admin-specific types for the platform

export type PlatformAdminRole = "super_admin" | "platform_admin" | "support_admin";

export interface PlatformAdmin {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: PlatformAdminRole;
    created_at: number;
    last_login?: number;
    is_active: boolean;
}

export interface TenantStats {
    tenant_id: string;
    total_users: number;
    active_users: number;
    total_files: number;
    total_folders: number;
    storage_used: number;
    storage_limit: number;
    created_at: number;
    last_activity?: number;
}

export interface SystemHealth {
    status: "healthy" | "degraded" | "critical";
    database: {
        status: "connected" | "disconnected";
        latency?: number;
    };
    storage: {
        status: "available" | "unavailable";
        provider: string;
    };
    firebase: {
        status: "connected" | "disconnected";
    };
    last_checked: number;
}

export interface AdminAuditLog {
    id: string;
    admin_id: string;
    admin_email: string;
    action: AdminAction;
    target_type: "tenant" | "user" | "system" | "settings";
    target_id?: string;
    timestamp: number;
    ip_address?: string;
    metadata?: Record<string, any>;
}

export type AdminAction =
    | "tenant_create"
    | "tenant_update"
    | "tenant_suspend"
    | "tenant_delete"
    | "user_impersonate"
    | "user_update"
    | "user_delete"
    | "settings_update"
    | "quota_update"
    | "admin_login"
    | "admin_logout";

export interface TenantQuota {
    tenant_id: string;
    storage_limit: number; // bytes
    user_limit: number;
    file_upload_limit: number; // bytes per file
    features_enabled: string[];
    custom_settings?: Record<string, any>;
}

export interface PlatformStats {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    active_users_today: number;
    total_files: number;
    total_storage_used: number;
    total_storage_limit: number;
    files_uploaded_today: number;
    new_users_today: number;
}

export interface TenantBilling {
    tenant_id: string;
    plan: "free" | "basic" | "pro" | "enterprise";
    billing_email?: string;
    payment_method?: string;
    last_payment?: number;
    next_billing_date?: number;
    is_trial: boolean;
    trial_ends_at?: number;
}

export interface UserActivityLog {
    user_id: string;
    tenant_id: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    timestamp: number;
    ip_address?: string;
}
