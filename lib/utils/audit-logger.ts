import { db } from "@/lib/database/schema";
import { AuditLog } from "@/types/database";
import { v4 as uuidv4 } from "uuid";

export const logEvent = async (
    tenantId: string,
    actorId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, any>
) => {
    try {
        const logId = uuidv4();
        const now = Date.now();

        const logEntry: AuditLog = {
            id: logId,
            tenant_id: tenantId,
            actor_id: actorId,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            timestamp: now,
            metadata,
        };

        // Store logs under tenant for easier querying/isolation
        await db.set(`audit_logs/${tenantId}/${logId}`, logEntry);
    } catch (error) {
        console.error("Failed to log audit event:", error);
        // Don't throw, we don't want to break the main flow if logging fails
    }
};
