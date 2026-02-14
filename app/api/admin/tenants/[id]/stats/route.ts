import { NextRequest, NextResponse } from "next/server";
import { getTenantStats } from "@/lib/database/admin-schema";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const stats = await getTenantStats(params.id);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching tenant stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch tenant stats" },
            { status: 500 }
        );
    }
}
