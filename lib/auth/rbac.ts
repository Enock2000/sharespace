import { User, UserRole, Permission } from "@/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
    super_admin: 6,
    platform_admin: 5,
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
};

export const hasRole = (user: User, requiredRole: UserRole): boolean => {
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
};

export const canPerformAction = (
    user: User,
    resourceOwnerId: string,
    permissions: Permission[],
    action: "view" | "edit" | "admin",
    userTeamIds: string[] = []
): boolean => {
    // Owners and Admins have full access to tenant resources
    if (hasRole(user, "admin")) return true;

    // Resource owner has full access
    if (user.id === resourceOwnerId) return true;

    // Check explicit user permissions
    const userPermission = permissions.find(
        (p) => p.user_id === user.id
    );

    // Check explicit team permissions
    // Find all permissions granted to any of the user's teams
    const teamPermissions = permissions.filter(
        p => p.group_id && userTeamIds.includes(p.group_id)
    );

    // If no user permission AND no team permissions, return false
    if (!userPermission && teamPermissions.length === 0) return false;

    // Determine effective permission level
    // We need to resolve multiple permissions (e.g. user has 'view', team has 'edit')
    // Hierarchy: admin > edit > view

    const levels = [];
    if (userPermission) levels.push(userPermission.permission_level);
    teamPermissions.forEach(p => levels.push(p.permission_level));

    const hasAdmin = levels.includes("admin");
    const hasEdit = levels.includes("edit");
    // const hasView = levels.includes("view"); // Implicit if any exist

    if (action === "admin") return hasAdmin;
    if (action === "edit") return hasAdmin || hasEdit;
    if (action === "view") return true; // checks passed above

    return false;
};
