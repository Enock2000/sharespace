import { User, UserRole, Permission } from "@/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
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
    action: "view" | "edit" | "admin"
): boolean => {
    // Owners and Admins have full access to tenant resources
    if (hasRole(user, "admin")) return true;

    // Resource owner has full access
    if (user.id === resourceOwnerId) return true;

    // Check explicit permissions
    const userPermission = permissions.find(
        (p) => p.user_id === user.id
    );

    if (!userPermission) return false;

    if (action === "view") return true; // Any permission implies view
    if (action === "edit") return ["edit", "admin"].includes(userPermission.permission_level);
    if (action === "admin") return userPermission.permission_level === "admin";

    return false;
};
