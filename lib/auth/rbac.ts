import { User, UserRole, Permission } from "@/types/database";

const ROLE_HIERARCHY: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    guest: 1,
};

export const hasRole = (user: User, requiredRole: UserRole): boolean => {
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
};

export const canPerformAction = (
    user: User,
    resourceOwnerId: string,
    permissions: Permission[],
    action: "view" | "edit" | "delete"
): boolean => {
    // Owners and Admins have full access to tenant resources
    if (hasRole(user, "admin")) return true;

    // Resource owner has full access
    if (user.id === resourceOwnerId) return true;

    // Check explicit permissions
    const userPermission = permissions.find(
        (p) => p.principal_id === user.id && p.principal_type === "user"
    );

    if (!userPermission) return false;

    if (action === "view") return true; // Any permission implies view
    if (action === "edit") return ["edit", "delete"].includes(userPermission.access_level);
    if (action === "delete") return userPermission.access_level === "delete";

    return false;
};
