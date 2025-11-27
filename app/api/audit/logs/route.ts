import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, AuditLog } from "@/types/database";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    try {
        const user = await db.get<User>(`users/${userId}`);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only admins/owners should see audit logs
        if (user.role !== "owner" && user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch logs for tenant
        // In Realtime DB, we fetch the whole node for the tenant
        const logsMap = await db.get<Record<string, AuditLog>>(`audit_logs/${user.tenant_id}`);
        const logs = logsMap ? Object.values(logsMap) : [];

        // Sort by timestamp desc
        logs.sort((a, b) => b.timestamp - a.timestamp);

        return NextResponse.json({ logs });
    } catch (error: any) {
        console.error("Fetch audit logs error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
