export type UserRole = "owner" | "admin" | "member" | "viewer";

export interface Tenant {
    id: string;
    name: string;
    created_at: number;
    owner_id: string;
}

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    role: UserRole;
    tenant_id: string;
    created_at: number;
    updated_at: number;
    is_active: boolean;
}

export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    tenant_id: string;
    created_by: string;
    created_at: number;
    updated_at: number;
}

export interface File {
    id: string;
    name: string;
    folder_id: string;
    tenant_id: string;
    uploaded_by: string;
    size: number;
    mime_type: string;
    storage_key: string;
    created_at: number;
    updated_at: number;
    current_version: string;
    is_deleted: boolean;
}

export interface FileVersion {
    id: string;
    file_id: string;
    version_number: number;
    storage_key: string;
    size: number;
    uploaded_by: string;
    uploaded_at: number;
    comment?: string;
}

export interface Permission {
    id: string;
    resource_type: "file" | "folder";
    resource_id: string;
    user_id?: string;
    group_id?: string;
    permission_level: "view" | "edit" | "admin";
    granted_by: string;
    granted_at: number;
}

export interface ShareLink {
    id: string;
    file_id: string;
    created_by: string;
    created_at: number;
    expires_at?: number;
    password_hash?: string;
    access_count: number;
    max_access_count?: number;
    is_active: boolean;
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
