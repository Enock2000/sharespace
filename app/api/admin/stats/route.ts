import { NextRequest, NextResponse } from "next/server";
import { getPlatformStats } from "@/lib/database/admin-schema";

export async function GET(request: NextRequest) {
    try {
        const stats = await getPlatformStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch platform statistics" },
            { status: 500 }
        );
    }
}
