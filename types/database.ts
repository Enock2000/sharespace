export type UserRole = "owner" | "admin" | "member" | "guest";
export type TenantStatus = "active" | "trial" | "suspended";
export type FileType = "file" | "folder";

export interface Tenant {
    id: string;
    name: string;
    plan: "free" | "pro" | "enterprise";
    status: TenantStatus;
    storage_used: number;
    owner_id: string;
    created_at: number;
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    tenant_id: string;
    status: "active" | "disabled";
    created_at: number;
}

export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    tenant_id: string;
    owner_id: string;
    created_at: number;
    path: string[]; // Array of folder IDs for breadcrumbs
}

export interface File {
    id: string;
    name: string;
    folder_id: string;
    tenant_id: string;
    owner_id: string;
    size: number;
    mime_type: string;
    current_version: number;
    created_at: number;
    updated_at: number;
    is_deleted: boolean; // Soft delete
}

export interface FileVersion {
    id: string;
    file_id: string;
    version_number: number;
    storage_key: string; // B2 file ID or key
    size: number;
    uploaded_by: string;
    uploaded_at: number;
}

export interface Permission {
    id: string;
    resource_id: string;
    resource_type: "file" | "folder";
    principal_id: string; // User ID or Group ID (future)
    principal_type: "user" | "group";
    access_level: "view" | "edit" | "delete";
    created_at: number;
}

export interface ShareLink {
    id: string;
    resource_id: string;
    resource_type: "file" | "folder";
    token: string;
    expires_at: number | null;
    password_hash: string | null;
    created_by: string;
    created_at: number;
    access_level: "view" | "edit";
}

export interface AuditLog {
    id: string;
    tenant_id: string;
    actor_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    timestamp: number;
    metadata?: Record<string, any>;
}
