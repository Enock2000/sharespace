import { NextResponse } from "next/server";
import { db } from "@/lib/database/schema";
import { User, AuditLog } from "@/types/database";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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
        // Optimization: In a real app we would use startAt/endAt with timestamp
        // For now, we fetch all and filter/sort in memory (acceptable for < 10k logs)
        const logsMap = await db.get<Record<string, AuditLog>>(`audit_logs/${user.tenant_id}`);
        let logs = logsMap ? Object.values(logsMap) : [];

        // 1. Filter
        if (action) {
            logs = logs.filter(log => log.action === action);
        }

        if (dateFrom) {
            const fromTs = new Date(dateFrom).getTime();
            logs = logs.filter(log => log.timestamp >= fromTs);
        }

        if (dateTo) {
            const toTs = new Date(dateTo).getTime() + 86400000; // Include the whole day
            logs = logs.filter(log => log.timestamp <= toTs);
        }

        // 2. Sort
        logs.sort((a, b) => b.timestamp - a.timestamp);

        // 3. Paginate
        const total = logs.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedLogs = logs.slice(startIndex, endIndex);

        return NextResponse.json({
            logs: paginatedLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error("Fetch audit logs error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
