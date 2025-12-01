import { getFirebaseDatabase } from "@/lib/firebase-config";
import { ref, get, set, update, remove, query, orderByChild, equalTo } from "firebase/database";
import { TenantStats, PlatformStats, AdminAuditLog, TenantQuota, UserActivityLog } from "@/types/admin";
import { Tenant, User, File, Folder } from "@/types/database";

// Get a reference to the database
const db = getFirebaseDatabase();

// ===== Platform Admin Management =====

export async function getPlatformAdmins(): Promise<User[]> {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) return [];

    const users: User[] = [];
    snapshot.forEach((child) => {
        const user = child.val();
        if (user.role === "platform_admin" || user.role === "super_admin") {
            users.push({ id: child.key, ...user });
        }
    });

    return users;
}

export async function createPlatformAdmin(adminData: Omit<User, "id" | "created_at" | "updated_at">): Promise<string> {
    const adminId = `admin_${Date.now()}`;
    const adminRef = ref(db, `users/${adminId}`);

    await set(adminRef, {
        ...adminData,
        created_at: Date.now(),
        updated_at: Date.now(),
        tenant_id: "platform", // Platform admins don't belong to a tenant
    });

    return adminId;
}

// ===== Tenant Management =====

export async function getAllTenants(): Promise<Tenant[]> {
    const tenantsRef = ref(db, "tenants");
    const snapshot = await get(tenantsRef);

    if (!snapshot.exists()) return [];

    const tenants: Tenant[] = [];
    snapshot.forEach((child) => {
        tenants.push({ id: child.key, ...child.val() });
    });

    return tenants;
}

export async function getTenantById(tenantId: string): Promise<Tenant | null> {
    const tenantRef = ref(db, `tenants/${tenantId}`);
    const snapshot = await get(tenantRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.key!, ...snapshot.val() };
}

export async function updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<void> {
    const tenantRef = ref(db, `tenants/${tenantId}`);
    await update(tenantRef, updates);
}

export async function suspendTenant(tenantId: string, suspend: boolean): Promise<void> {
    await updateTenant(tenantId, { is_suspended: suspend });

    // Log the action
    await createAdminAuditLog({
        admin_id: "system", // Should be replaced with actual admin ID
        admin_email: "system",
        action: "tenant_suspend",
        target_type: "tenant",
        target_id: tenantId,
        timestamp: Date.now(),
        metadata: { suspended: suspend },
    });
}

export async function deleteTenant(tenantId: string): Promise<void> {
    const tenantRef = ref(db, `tenants/${tenantId}`);
    await remove(tenantRef);

    // Log the action
    await createAdminAuditLog({
        admin_id: "system",
        admin_email: "system",
        action: "tenant_delete",
        target_type: "tenant",
        target_id: tenantId,
        timestamp: Date.now(),
    });
}

// ===== Tenant Statistics =====

export async function getTenantStats(tenantId: string): Promise<TenantStats> {
    const [users, files, folders, tenant] = await Promise.all([
        getTenantUsers(tenantId),
        getTenantFiles(tenantId),
        getTenantFolders(tenantId),
        getTenantById(tenantId),
    ]);

    const storageUsed = files.reduce((sum, file) => sum + file.size, 0);
    const activeUsers = users.filter(u => u.is_active).length;

    return {
        tenant_id: tenantId,
        total_users: users.length,
        active_users: activeUsers,
        total_files: files.length,
        total_folders: folders.length,
        storage_used: storageUsed,
        storage_limit: tenant?.storage_quota || 250 * 1024 * 1024 * 1024, // 250GB default
        created_at: tenant?.created_at || Date.now(),
    };
}

async function getTenantUsers(tenantId: string): Promise<User[]> {
    const usersRef = ref(db, "users");
    const tenantQuery = query(usersRef, orderByChild("tenant_id"), equalTo(tenantId));
    const snapshot = await get(tenantQuery);

    if (!snapshot.exists()) return [];

    const users: User[] = [];
    snapshot.forEach((child) => {
        users.push({ id: child.key!, ...child.val() });
    });

    return users;
}

async function getTenantFiles(tenantId: string): Promise<File[]> {
    const filesRef = ref(db, "files");
    const tenantQuery = query(filesRef, orderByChild("tenant_id"), equalTo(tenantId));
    const snapshot = await get(tenantQuery);

    if (!snapshot.exists()) return [];

    const files: File[] = [];
    snapshot.forEach((child) => {
        const file = child.val();
        if (!file.is_deleted) {
            files.push({ id: child.key!, ...file });
        }
    });

    return files;
}

async function getTenantFolders(tenantId: string): Promise<Folder[]> {
    const foldersRef = ref(db, "folders");
    const tenantQuery = query(foldersRef, orderByChild("tenant_id"), equalTo(tenantId));
    const snapshot = await get(tenantQuery);

    if (!snapshot.exists()) return [];

    const folders: Folder[] = [];
    snapshot.forEach((child) => {
        folders.push({ id: child.key!, ...child.val() });
    });

    return folders;
}

// ===== Platform Statistics =====

export async function getPlatformStats(): Promise<PlatformStats> {
    const [tenants, users, files] = await Promise.all([
        getAllTenants(),
        getAllUsers(),
        getAllFiles(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const activeTenants = tenants.filter(t => !t.is_suspended).length;
    const activeUsersToday = users.filter(u => u.is_active && u.updated_at >= todayTimestamp).length;
    const filesUploadedToday = files.filter(f => f.created_at >= todayTimestamp).length;
    const newUsersToday = users.filter(u => u.created_at >= todayTimestamp).length;

    const totalStorageUsed = files.reduce((sum, file) => sum + file.size, 0);
    const totalStorageLimit = tenants.reduce((sum, tenant) => sum + (tenant.storage_quota || 0), 0);

    return {
        total_tenants: tenants.length,
        active_tenants: activeTenants,
        total_users: users.length,
        active_users_today: activeUsersToday,
        total_files: files.length,
        total_storage_used: totalStorageUsed,
        total_storage_limit: totalStorageLimit,
        files_uploaded_today: filesUploadedToday,
        new_users_today: newUsersToday,
    };
}

async function getAllUsers(): Promise<User[]> {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) return [];

    const users: User[] = [];
    snapshot.forEach((child) => {
        users.push({ id: child.key!, ...child.val() });
    });

    return users;
}

async function getAllFiles(): Promise<File[]> {
    const filesRef = ref(db, "files");
    const snapshot = await get(filesRef);

    if (!snapshot.exists()) return [];

    const files: File[] = [];
    snapshot.forEach((child) => {
        const file = child.val();
        if (!file.is_deleted) {
            files.push({ id: child.key!, ...file });
        }
    });

    return files;
}

// ===== Admin Audit Logs =====

export async function createAdminAuditLog(log: Omit<AdminAuditLog, "id">): Promise<string> {
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const logRef = ref(db, `admin_audit_logs/${logId}`);

    await set(logRef, log);

    return logId;
}

export async function getAdminAuditLogs(limit: number = 100): Promise<AdminAuditLog[]> {
    const logsRef = ref(db, "admin_audit_logs");
    const snapshot = await get(logsRef);

    if (!snapshot.exists()) return [];

    const logs: AdminAuditLog[] = [];
    snapshot.forEach((child) => {
        logs.push({ id: child.key!, ...child.val() });
    });

    // Sort by timestamp descending and limit
    return logs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

// ===== User Management =====

export async function searchUsers(searchTerm: string): Promise<User[]> {
    const users = await getAllUsers();

    const term = searchTerm.toLowerCase();
    return users.filter(user =>
        user.email.toLowerCase().includes(term) ||
        user.first_name.toLowerCase().includes(term) ||
        user.last_name.toLowerCase().includes(term)
    );
}

export async function updateUserRole(userId: string, newRole: string): Promise<void> {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
        role: newRole,
        updated_at: Date.now(),
    });
}

export async function deactivateUser(userId: string): Promise<void> {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, {
        is_active: false,
        updated_at: Date.now(),
    });
}

// ===== Tenant Quotas =====

export async function getTenantQuota(tenantId: string): Promise<TenantQuota | null> {
    const quotaRef = ref(db, `tenant_quotas/${tenantId}`);
    const snapshot = await get(quotaRef);

    if (!snapshot.exists()) return null;

    return { tenant_id: tenantId, ...snapshot.val() };
}

export async function updateTenantQuota(tenantId: string, quota: Partial<TenantQuota>): Promise<void> {
    const quotaRef = ref(db, `tenant_quotas/${tenantId}`);
    await update(quotaRef, quota);

    await createAdminAuditLog({
        admin_id: "system",
        admin_email: "system",
        action: "quota_update",
        target_type: "tenant",
        target_id: tenantId,
        timestamp: Date.now(),
        metadata: quota,
    });
}
