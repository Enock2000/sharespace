import { NextRequest, NextResponse } from "next/server";
import { getAdminAuditLogs } from "@/lib/database/admin-schema";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100");

        const logs = await getAdminAuditLogs(limit);

        return NextResponse.json({ logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
