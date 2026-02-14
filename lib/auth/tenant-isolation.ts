import { User } from "@/types/database";

export const validateTenantAccess = (user: User, resourceTenantId: string): boolean => {
    return user.tenant_id === resourceTenantId;
};

export const getTenantPath = (tenantId: string, path: string): string => {
    return `tenants/${tenantId}/${path}`;
};

export const getUserPath = (userId: string, path: string): string => {
    return `users/${userId}/${path}`;
};
