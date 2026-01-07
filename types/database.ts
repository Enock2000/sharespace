export type UserRole = "owner" | "admin" | "member" | "viewer" | "platform_admin" | "super_admin";

export interface Tenant {
    id: string;
    name: string;
    created_at: number;
    owner_id: string;
    is_suspended: boolean;
    storage_quota: number; // bytes
    user_limit: number;
    plan: "free" | "basic" | "pro" | "enterprise";
}

export interface ShareLink {
    id: string;
    tenant_id: string;
    file_id: string;
    token: string;
    password_hash?: string; // Optional password protection
    expires_at?: number;   // Optional expiration timestamp
    created_by: string;
    created_at: number;
    access_count: number;
    is_active: boolean;
}

export interface FilePermission {
    id: string;
    file_id: string;
    tenant_id: string;
    user_id: string;
    role: 'viewer' | 'editor';
    added_by: string;
    added_at: number;
}

export interface ChatChannel {
    id: string;
    tenant_id: string;
    name: string;
    type: 'public' | 'private';
    created_by: string;
    created_at: number;
    members?: Record<string, boolean>;
}

export interface DMConversation {
    id: string;
    participants: string[]; // User IDs
    participants_tenants: Record<string, string>; // UserID -> TenantID
    last_message?: {
        content: string;
        sender_id: string;
        timestamp: number;
    };
    created_at: number;
    updated_at: number;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    timestamp: number;
    read_by?: Record<string, number>;
    type: 'text' | 'file';
    file_attachment?: {
        name: string;
        url: string;
        size: number;
        type: string;
    };
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
    folder_id: string | null;
    tenant_id: string;
    uploaded_by: string;
    size: number;
    mime_type: string;
    storage_key: string; // Backblaze B2 file ID
    b2_file_name?: string; // Backblaze B2 file name for downloads
    created_at: number;
    updated_at: number;
    current_version: string;
    is_deleted: boolean;
}

export interface FileVersion {
    id: string;
    file_id: string;
    version_number: number;
    storage_key: string; // Backblaze B2 file ID
    b2_file_name?: string; // Backblaze B2 file name for downloads
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

// ========== TRASH & RECOVERY ==========
export interface DeletedItem {
    id: string;
    item_type: "file" | "folder";
    item_id: string;
    item_name: string;
    original_path: string; // Parent folder ID or null for root
    tenant_id: string;
    deleted_by: string;
    deleted_at: number;
    expires_at: number; // Auto-purge date (30 days default)
    size?: number; // Only for files
    mime_type?: string; // Only for files
}

// ========== NOTIFICATION SYSTEM ==========
export type NotificationType =
    | "file_shared"
    | "comment_added"
    | "mention"
    | "file_updated"
    | "storage_warning"
    | "invitation"
    | "file_request"
    | "system";

export interface Notification {
    id: string;
    user_id: string;
    tenant_id: string;
    type: NotificationType;
    title: string;
    message: string;
    resource_type?: "file" | "folder" | "user" | "system";
    resource_id?: string;
    actor_id?: string; // Who triggered the notification
    is_read: boolean;
    created_at: number;
    action_url?: string; // Link to navigate on click
}

export interface NotificationPreferences {
    user_id: string;
    email_enabled: boolean;
    push_enabled: boolean;
    file_shared: boolean;
    comments: boolean;
    mentions: boolean;
    file_updates: boolean;
    storage_warnings: boolean;
    marketing: boolean;
}

// ========== TAGS & METADATA ==========
export interface FileTag {
    id: string;
    tenant_id: string;
    name: string;
    color: string; // Hex color code
    created_by: string;
    created_at: number;
}

export interface FileTagAssignment {
    file_id: string;
    tag_id: string;
    assigned_by: string;
    assigned_at: number;
}

// ========== FAVORITES & RECENT ==========
export interface FavoriteFile {
    user_id: string;
    file_id: string;
    added_at: number;
}

export interface RecentFile {
    user_id: string;
    file_id: string;
    accessed_at: number;
}

// ========== COMMENTS ==========
export interface FileComment {
    id: string;
    file_id: string;
    user_id: string;
    content: string;
    parent_id: string | null; // For threaded replies
    mentions: string[]; // User IDs mentioned
    is_resolved: boolean;
    created_at: number;
    updated_at: number;
}

// ========== TEAMS & GROUPS ==========
export interface Team {
    id: string;
    tenant_id: string;
    name: string;
    description: string;
    color: string;
    created_by: string;
    created_at: number;
    updated_at: number;
}

export interface TeamMember {
    team_id: string;
    user_id: string;
    role: "admin" | "member";
    added_by: string;
    added_at: number;
}
